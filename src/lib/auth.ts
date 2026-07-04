import "@tanstack/react-start/server-only";
import crypto from "node:crypto";

/**
 * DASHBOARD AUTHENTICATION.
 *
 * Single-admin auth for the internal dashboard. The password is chosen by the
 * user on first launch, hashed with Node's built-in scrypt, and stored in the
 * app_settings table. Sessions are HMAC-signed cookies (no DB session table).
 *
 * Nothing here embeds a default password, hardcoded secret, or "reset code".
 * If the admin ever forgets it, they can clear the ADMIN_PASSWORD_HASH row in
 * app_settings and go through first-launch setup again.
 */

const KEYS = {
  passwordHash: "ADMIN_PASSWORD_HASH",
  sessionSecret: "AUTH_SESSION_SECRET",
  username: "ADMIN_USERNAME",
} as const;

/** Session validity — cookie refresh happens on every authenticated request. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "kb_seo_session";

/* --------------------------- password hashing --------------------------- */

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `s1.${salt.toString("hex")}.${key.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(".");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = crypto.scryptSync(password.normalize("NFKC"), salt, expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

/* ----------------------------- session token ---------------------------- */

async function getSessionSecret(): Promise<string> {
  const { getSetting, setSetting } = await import("@/server/db/repos/app-settings");
  let secret = await getSetting(KEYS.sessionSecret);
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await setSetting(KEYS.sessionSecret, secret);
  }
  return secret;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

async function signToken(payload: object): Promise<string> {
  const secret = await getSessionSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

async function verifyToken(
  token: string | undefined | null,
): Promise<{ iat: number; exp: number } | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const secret = await getSessionSecret();
  const expected = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  // Constant-time comparison
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  let payload: { iat?: number; exp?: number };
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8")) as { iat?: number; exp?: number };
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return { iat: payload.iat ?? 0, exp: payload.exp };
}

/* ----------------------------- cookie helpers --------------------------- */

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie") ?? "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function isHttps(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  const xf = request.headers.get("x-forwarded-proto");
  return xf?.toLowerCase().includes("https") ?? false;
}

export function buildSessionCookie(token: string, request: Request): string {
  const attrs = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isHttps(request)) attrs.push("Secure");
  return attrs.join("; ");
}

export function buildClearCookie(request: Request): string {
  const attrs = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isHttps(request)) attrs.push("Secure");
  return attrs.join("; ");
}

/* ---------------------------- public API ------------------------------- */

export type AuthState = {
  configured: boolean;
  authenticated: boolean;
  username?: string;
};

/** Is the admin password set yet? (First-run detection.) */
export async function isConfigured(): Promise<boolean> {
  const { getSetting } = await import("@/server/db/repos/app-settings");
  const hash = await getSetting(KEYS.passwordHash);
  return !!(hash && hash.startsWith("s1."));
}

/** Set the admin password (first-run or change). */
export async function setAdminPassword(password: string, username?: string): Promise<void> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const { setSetting } = await import("@/server/db/repos/app-settings");
  await setSetting(KEYS.passwordHash, hashPassword(password));
  if (username && username.trim()) await setSetting(KEYS.username, username.trim());
  // Rotate the session secret so any old cookies stop working.
  await setSetting(KEYS.sessionSecret, crypto.randomBytes(32).toString("hex"));
}

/** Verify a password attempt. Returns a fresh session cookie header on success. */
export async function login(
  password: string,
  request: Request,
): Promise<{ ok: boolean; cookie?: string; error?: string }> {
  const { getSetting } = await import("@/server/db/repos/app-settings");
  const stored = await getSetting(KEYS.passwordHash);
  if (!stored) return { ok: false, error: "Admin password not set up yet." };
  if (!verifyPassword(password, stored)) return { ok: false, error: "Incorrect password." };
  const now = Date.now();
  const token = await signToken({ iat: now, exp: now + SESSION_TTL_MS });
  return { ok: true, cookie: buildSessionCookie(token, request) };
}

/** Inspect the current request. Returns whether it's authenticated. */
export async function getAuthState(request: Request): Promise<AuthState> {
  const configured = await isConfigured();
  if (!configured) return { configured: false, authenticated: false };
  const cookies = parseCookies(request);
  const session = await verifyToken(cookies[SESSION_COOKIE]);
  if (!session) return { configured: true, authenticated: false };
  const { getSetting } = await import("@/server/db/repos/app-settings");
  const username = (await getSetting(KEYS.username)) || "admin";
  return { configured: true, authenticated: true, username };
}

/** True if the current request has a valid session. */
export async function isAuthenticated(request: Request): Promise<boolean> {
  return (await getAuthState(request)).authenticated;
}

/** Refresh (extend) the session cookie for an already-authenticated request. */
export async function refreshSession(request: Request): Promise<string | null> {
  const state = await getAuthState(request);
  if (!state.authenticated) return null;
  const now = Date.now();
  const token = await signToken({ iat: now, exp: now + SESSION_TTL_MS });
  return buildSessionCookie(token, request);
}
