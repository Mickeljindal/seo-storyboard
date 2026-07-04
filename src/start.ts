import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { loadProjectEnv } from "./lib/load-env";

const envMiddleware = createMiddleware().server(async ({ next }) => {
  loadProjectEnv();
  return next();
});

/* --------------------------- auth middleware --------------------------- */
/**
 * Dashboard auth gate.
 *
 * - When the admin password isn't set yet, every non-static request is routed
 *   through /login (which shows the setup form).
 * - Once configured, requests need a valid session cookie. Page requests get a
 *   redirect to /login?next=…; API/server-function requests get a 401 JSON.
 * - The auth-related server functions themselves are always allowed so the
 *   login/setup UI can call them.
 */

/** Path segments (matched via includes) that identify auth server functions. */
const AUTH_SERVER_FN_MARKERS = ["authStatusFn", "loginFn", "setupAdminFn"];

function isStaticAsset(pathname: string): boolean {
  // Vite emits assets under /assets/* (and .well-known + favicons are static).
  return (
    pathname.startsWith("/_build/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/favicon.ico" ||
    /\.(js|css|map|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico|json|txt|xml)$/i.test(pathname)
  );
}

function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function looksLikeServerFn(pathname: string, request: Request): boolean {
  // TanStack Start posts server functions with a specific URL pattern.
  if (pathname.includes("/_serverFn")) return true;
  if (request.headers.get("x-tanstack-server-fn")) return true;
  const url = new URL(request.url);
  return url.searchParams.has("_serverFn");
}

function isAuthServerFn(request: Request): boolean {
  const url = new URL(request.url);
  const combined = `${url.pathname}?${url.searchParams.toString()}`;
  return AUTH_SERVER_FN_MARKERS.some((m) => combined.includes(m));
}

const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Always allow static assets and the login route itself.
  if (isStaticAsset(pathname)) return next();
  if (isAuthPath(pathname)) return next();
  // Always allow the auth-related server functions.
  if (isAuthServerFn(request)) return next();

  try {
    const { getAuthState } = await import("./lib/auth");
    const state = await getAuthState(request);

    if (!state.configured || !state.authenticated) {
      // Server-function calls: return a 401 JSON so the client can handle it.
      if (looksLikeServerFn(pathname, request)) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: state.configured ? "Not signed in." : "Setup required.",
            code: state.configured ? "unauthenticated" : "setup_required",
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      // Page requests: redirect to /login with a return path.
      const next = pathname + url.search;
      const location = `/login?next=${encodeURIComponent(next)}`;
      return new Response(null, { status: 302, headers: { Location: location } });
    }
  } catch (e) {
    // Never lock the user out on an auth-lookup failure — surface the error page.
    console.error("[auth] middleware error:", e);
  }

  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [envMiddleware, authMiddleware, errorMiddleware],
}));
