import session from "express-session";

function trimEnv(value) {
  const v = String(value ?? "").trim();
  return v || null;
}

export function createSessionMiddleware() {
  const secret =
    trimEnv(process.env.SESSION_SECRET) ||
    (process.env.NODE_ENV === "production" ? null : "cpd-dev-session-secret-change-me");

  if (!secret) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  if (secret === "cpd-dev-session-secret-change-me") {
    console.warn("Using default SESSION_SECRET — set SESSION_SECRET in .env for production.");
  }

  const trustProxy = process.env.TRUST_PROXY === "1";
  const secureCookie =
    process.env.SESSION_SECURE === "1" || trimEnv(process.env.APP_URL)?.startsWith("https://") === true;

  return session({
    name: "cpd.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    proxy: trustProxy,
    cookie: {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}
