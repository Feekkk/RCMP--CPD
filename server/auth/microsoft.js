import * as client from "openid-client";
import crypto from "crypto";

let oidcConfigPromise = null;

function trimEnv(value) {
  const v = String(value ?? "").trim();
  return v || null;
}

export function isMicrosoftSsoConfigured() {
  return Boolean(
    trimEnv(process.env.AZURE_CLIENT_ID) &&
      trimEnv(process.env.AZURE_CLIENT_SECRET) &&
      trimEnv(process.env.AZURE_TENANT_ID) &&
      trimEnv(process.env.AZURE_REDIRECT_URI),
  );
}

function getRedirectUri() {
  return trimEnv(process.env.AZURE_REDIRECT_URI);
}

function buildMicrosoftAuthorizeUrl({ tenantId, clientId, redirectUri, state, codeChallenge }) {
  if (!redirectUri) {
    throw new Error("AZURE_REDIRECT_URI is not set.");
  }

  const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile email offline_access User.Read");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

function callbackUrlFromRequest(req, redirectUri) {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  return new URL(`${redirectUri}${query}`);
}

function appOrigin(req) {
  const configured = trimEnv(process.env.APP_URL);
  if (configured) return configured.replace(/\/$/, "");
  const host = req.get("host");
  return `${req.protocol}://${host}`;
}

function loginRedirect(req, code, message) {
  const params = new URLSearchParams({ sso_error: message });
  if (code) params.set("sso_code", code);
  return `${appOrigin(req)}/login?${params.toString()}`;
}

async function getOidcConfig() {
  if (!isMicrosoftSsoConfigured()) {
    throw new Error("Microsoft SSO is not configured.");
  }
  if (!oidcConfigPromise) {
    const tenantId = trimEnv(process.env.AZURE_TENANT_ID);
    const issuer = new URL(`https://login.microsoftonline.com/${tenantId}/v2.0`);
    oidcConfigPromise = client.discovery(
      issuer,
      trimEnv(process.env.AZURE_CLIENT_ID),
      trimEnv(process.env.AZURE_CLIENT_SECRET),
    );
  }
  return oidcConfigPromise;
}

async function findStaffByEmail(pool, email) {
  const [rows] = await pool.execute(
    `SELECT s.staff_id, s.full_name, s.email_address, s.phone_number, s.department_id,
            d.department_name, s.role_id, r.role_name
     FROM staff s
     INNER JOIN role_table r ON r.role_id = s.role_id
     INNER JOIN department_table d ON d.department_id = s.department_id
     WHERE LOWER(s.email_address) = LOWER(?)
     LIMIT 1`,
    [email.trim()],
  );
  return rows[0] ?? null;
}

function emailFromClaims(claims) {
  const preferred = claims?.preferred_username ?? claims?.email;
  if (typeof preferred === "string" && preferred.includes("@")) {
    return preferred.trim().toLowerCase();
  }
  const upn = claims?.upn;
  if (typeof upn === "string" && upn.includes("@")) {
    return upn.trim().toLowerCase();
  }
  return null;
}

function profileFromClaims(claims) {
  const email = emailFromClaims(claims);
  return {
    name: typeof claims?.name === "string" ? claims.name.trim() : null,
    givenName: typeof claims?.given_name === "string" ? claims.given_name.trim() : null,
    familyName: typeof claims?.family_name === "string" ? claims.family_name.trim() : null,
    email,
    preferredUsername:
      typeof claims?.preferred_username === "string" ? claims.preferred_username.trim() : null,
    picture: typeof claims?.picture === "string" ? claims.picture.trim() : null,
  };
}

function serializeClaims(claims) {
  if (!claims || typeof claims !== "object") return {};
  return JSON.parse(JSON.stringify(claims));
}

function attachEntraSession(req, tokens) {
  const claims = tokens.claims();
  const expiresIn = Number(tokens.expires_in ?? 3600);
  req.session.entra = {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: Date.now() + expiresIn * 1000,
    idTokenClaims: serializeClaims(claims),
    scopes: typeof tokens.scope === "string" ? tokens.scope : "openid profile email offline_access User.Read",
  };
}

async function fetchGraphJson(accessToken, path) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body?.error?.message ?? body?.error?.code ?? res.statusText,
      body,
    };
  }
  return { ok: true, status: res.status, data: body };
}

async function refreshEntraAccessToken(req) {
  const entra = req.session?.entra;
  if (!entra?.refreshToken) {
    return null;
  }
  const config = await getOidcConfig();
  const tokens = await client.refreshTokenGrant(config, entra.refreshToken, {
    scope: entra.scopes,
  });
  attachEntraSession(req, tokens);
  return req.session.entra.accessToken;
}

async function getEntraAccessToken(req) {
  const entra = req.session?.entra;
  if (!entra?.accessToken) {
    return null;
  }
  if (entra.expiresAt && Date.now() >= entra.expiresAt - 60_000) {
    return refreshEntraAccessToken(req);
  }
  return entra.accessToken;
}

async function buildEntraProfilePayload(req) {
  const entra = req.session?.entra;
  if (!entra) {
    return { error: "No Microsoft Entra session. Sign in with Microsoft SSO first.", status: 401 };
  }

  const accessToken = await getEntraAccessToken(req);
  const graphRequests = [
    { name: "GET /me", path: "/me" },
    {
      name: "GET /me (extended select)",
      path: "/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,preferredLanguage,usageLocation,employeeId,employeeType,companyName,country,city,state,streetAddress,postalCode,onPremisesSamAccountName,onPremisesUserPrincipalName,onPremisesDistinguishedName,accountEnabled,createdDateTime",
    },
    { name: "GET /me/manager", path: "/me/manager" },
    { name: "GET /me/memberOf", path: "/me/memberOf?$top=25" },
    { name: "GET /me/photo/metadata", path: "/me/photo" },
  ];

  const microsoftGraph = {};
  if (!accessToken) {
    microsoftGraph.tokenError = "Access token missing or refresh failed. Sign in again with Microsoft SSO.";
  } else {
    for (const request of graphRequests) {
      const result = await fetchGraphJson(accessToken, request.path);
      microsoftGraph[request.name] = result.ok
        ? { status: result.status, data: result.data }
        : { status: result.status, error: result.error, details: result.body };
    }
  }

  return {
    source: "microsoft-entra-id",
    fetchedAt: new Date().toISOString(),
    scopes: entra.scopes,
    idTokenClaims: entra.idTokenClaims,
    microsoftGraph,
  };
}

export function attachSessionUser(req, row, { microsoftProfile = null } = {}) {
  req.session.user = {
    staffId: row.staff_id,
    fullName: row.full_name,
    email: row.email_address,
    phoneNumber: row.phone_number ?? null,
    departmentId: row.department_id,
    departmentName: row.department_name,
    roleId: row.role_id,
    roleName: row.role_name,
    authProvider: microsoftProfile ? "microsoft" : "password",
    microsoft: microsoftProfile,
  };
}

export function registerMicrosoftAuthRoutes(apiRouter, { pool, dashboardPathForRole, loginLimiter }) {
  apiRouter.get("/auth/microsoft/status", (_req, res) => {
    res.json({
      enabled: isMicrosoftSsoConfigured(),
      provider: "microsoft",
    });
  });

  apiRouter.get("/auth/me", (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Not signed in." });
    }
    return res.json({
      ...req.session.user,
      redirect: dashboardPathForRole(req.session.user.roleId),
    });
  });

  apiRouter.get("/auth/entra/profile", async (req, res) => {
    try {
      const payload = await buildEntraProfilePayload(req);
      if (payload.error) {
        return res.status(payload.status ?? 401).json({ error: payload.error });
      }
      return res.json(payload);
    } catch (err) {
      console.error("Entra profile fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch Entra ID profile." });
    }
  });

  apiRouter.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Could not sign out." });
      }
      res.clearCookie("cpd.sid");
      return res.json({ ok: true });
    });
  });

  if (!isMicrosoftSsoConfigured()) {
    apiRouter.get("/auth/microsoft", (_req, res) => {
      res.status(503).json({
        error: "Microsoft SSO is not configured on the server.",
        hint: "Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, and AZURE_REDIRECT_URI in .env",
      });
    });
    apiRouter.get("/auth/microsoft/callback", (_req, res) => {
      res.status(503).json({
        error: "Microsoft SSO is not configured on the server.",
      });
    });
    return;
  }

  apiRouter.get("/auth/microsoft", loginLimiter, async (req, res) => {
    try {
      const redirectUri = getRedirectUri();
      const tenantId = trimEnv(process.env.AZURE_TENANT_ID);
      const clientId = trimEnv(process.env.AZURE_CLIENT_ID);

      if (!redirectUri || !tenantId || !clientId) {
        return res.redirect(
          loginRedirect(req, "config", "Microsoft SSO is misconfigured. Check AZURE_* values in .env and restart the API."),
        );
      }

      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      const state = crypto.randomBytes(16).toString("hex");

      req.session.oauthState = state;
      req.session.oauthCodeVerifier = codeVerifier;

      const authUrl = buildMicrosoftAuthorizeUrl({
        tenantId,
        clientId,
        redirectUri,
        state,
        codeChallenge,
      });

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error (microsoft start):", saveErr);
          return res.redirect(loginRedirect(req, "session", "Could not start sign-in. Try again."));
        }
        return res.redirect(authUrl.href);
      });
    } catch (err) {
      console.error("Microsoft SSO start error:", err);
      return res.redirect(
        loginRedirect(req, "start", "Microsoft sign-in is unavailable. Contact IT support."),
      );
    }
  });

  apiRouter.get("/auth/microsoft/callback", loginLimiter, async (req, res) => {
    const expectedState = req.session.oauthState;
    const codeVerifier = req.session.oauthCodeVerifier;
    delete req.session.oauthState;
    delete req.session.oauthCodeVerifier;

    try {
      if (!expectedState || !codeVerifier) {
        return res.redirect(
          loginRedirect(req, "state", "Sign-in session expired. Please try Microsoft SSO again."),
        );
      }

      const config = await getOidcConfig();
      const redirectUri = getRedirectUri();
      if (!redirectUri) {
        return res.redirect(
          loginRedirect(req, "config", "Microsoft SSO redirect URI is missing. Set AZURE_REDIRECT_URI in .env."),
        );
      }

      const callbackUrl = callbackUrlFromRequest(req, redirectUri);

      const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState,
      });

      const claims = tokens.claims();
      const email = emailFromClaims(claims);
      if (!email) {
        return res.redirect(
          loginRedirect(
            req,
            "email",
            "Microsoft account did not return an email address. Use Staff ID login or contact admin.",
          ),
        );
      }

      const row = await findStaffByEmail(pool, email);
      if (!row) {
        return res.redirect(
          loginRedirect(
            req,
            "not_registered",
            `No CPD account for ${email}. Contact HR or admin to be added to the system.`,
          ),
        );
      }

      attachEntraSession(req, tokens);
      attachSessionUser(req, row, { microsoftProfile: profileFromClaims(claims) });
      const destination = `${appOrigin(req)}${dashboardPathForRole(row.role_id)}`;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error (microsoft callback):", saveErr);
          return res.redirect(loginRedirect(req, "session", "Signed in but session failed. Try again."));
        }
        return res.redirect(destination);
      });
    } catch (err) {
      console.error("Microsoft SSO callback error:", err);
      return res.redirect(
        loginRedirect(req, "callback", "Microsoft sign-in failed. Try again or use Staff ID login."),
      );
    }
  });
}
