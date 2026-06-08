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
  url.searchParams.set("scope", "openid profile email offline_access");
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
    `SELECT s.staff_id, s.full_name, s.email_address, s.department_id,
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

export function attachSessionUser(req, row) {
  req.session.user = {
    staffId: row.staff_id,
    fullName: row.full_name,
    email: row.email_address,
    departmentId: row.department_id,
    departmentName: row.department_name,
    roleId: row.role_id,
    roleName: row.role_name,
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

      attachSessionUser(req, row);
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
