import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Server functions for dashboard auth. These are the ONLY server functions
 * allowed through the auth middleware without a session (see src/start.ts).
 */

/** First-run: create the admin password. Refuses if already configured. */
export const setupAdminFn = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        password: z.string().min(8, "Password must be at least 8 characters."),
        confirmPassword: z.string().min(8),
        username: z.string().optional(),
      })
      .refine((v) => v.password === v.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { isConfigured, setAdminPassword, login } = await import("./auth");
    if (await isConfigured()) {
      throw new Error("Admin password is already set. Use Change Password when signed in.");
    }
    await setAdminPassword(data.password, data.username);
    // Auto-log-in after setup so the user isn't kicked to the login page.
    const request = getRequest();
    const res = await login(data.password, request);
    if (!res.ok || !res.cookie) throw new Error(res.error ?? "Setup failed");
    setResponseHeader("Set-Cookie", res.cookie);
    return { ok: true as const };
  });

/** Verify a password attempt and set the session cookie on success. */
export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { login } = await import("./auth");
    const request = getRequest();
    const res = await login(data.password, request);
    if (!res.ok) throw new Error(res.error ?? "Login failed");
    setResponseHeader("Set-Cookie", res.cookie!);
    return { ok: true as const };
  });

/** Clear the session cookie. */
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { buildClearCookie } = await import("./auth");
  const request = getRequest();
  setResponseHeader("Set-Cookie", buildClearCookie(request));
  return { ok: true as const };
});

/** Current auth state — used by the login page to decide setup vs login. */
export const authStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getAuthState } = await import("./auth");
  const request = getRequest();
  return getAuthState(request);
});

/** Change the password while signed in — requires current password. */
export const changePasswordFn = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
      .refine((v) => v.newPassword === v.confirmPassword, {
        message: "New passwords do not match.",
        path: ["confirmPassword"],
      }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { login, setAdminPassword, isAuthenticated } = await import("./auth");
    const request = getRequest();
    if (!(await isAuthenticated(request))) throw new Error("Not signed in.");
    // Re-verify the current password to prevent hijacked-cookie password changes.
    const verify = await login(data.currentPassword, request);
    if (!verify.ok) throw new Error("Current password is incorrect.");
    await setAdminPassword(data.newPassword);
    // Rotate session so the just-signed-in cookie remains valid but stale ones die.
    const relogin = await login(data.newPassword, request);
    if (relogin.ok && relogin.cookie) setResponseHeader("Set-Cookie", relogin.cookie);
    return { ok: true as const };
  });
