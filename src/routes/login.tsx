import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, LogIn, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { authStatusFn, loginFn, setupAdminFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({ component: LoginPage });

type AuthStatus = { configured: boolean; authenticated: boolean; username?: string };

function LoginPage() {
  const navigate = useNavigate();
  const statusFn = useServerFn(authStatusFn);
  const setupFn = useServerFn(setupAdminFn);
  const loginServerFn = useServerFn(loginFn);

  const status = useQuery({ queryKey: ["auth-status"], queryFn: () => statusFn({}) });
  const s = status.data as AuthStatus | undefined;

  // If already authenticated, bounce to the destination.
  useEffect(() => {
    if (s?.authenticated) {
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      navigate({ to: next, replace: true });
    }
  }, [s?.authenticated, navigate]);

  // Setup mode
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");

  const setup = useMutation({
    mutationFn: () =>
      setupFn({
        data: { password: pw, confirmPassword: confirm, username: username.trim() || undefined },
      }),
    onSuccess: () => {
      toast.success("Password set. Signing you in…");
      // Small delay so the Set-Cookie header is applied on the browser before we navigate.
      setTimeout(() => navigate({ to: "/", replace: true }), 200);
    },
    onError: (e: Error) => toast.error(e.message || "Setup failed"),
  });

  const doLogin = useMutation({
    mutationFn: () => loginServerFn({ data: { password: pw } }),
    onSuccess: () => {
      toast.success("Welcome back.");
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      setTimeout(() => navigate({ to: next, replace: true }), 200);
    },
    onError: (e: Error) => toast.error(e.message || "Login failed"),
  });

  if (status.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const setupMode = s && !s.configured;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          {setupMode ? (
            <>
              <ShieldPlus className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">First-time setup</h1>
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Sign in</h1>
            </>
          )}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {setupMode
            ? "Choose a password to protect this dashboard. You'll use it every time you sign in — write it down somewhere safe. There's no reset link."
            : "Enter your password to continue."}
        </p>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (setupMode) setup.mutate();
            else doLogin.mutate();
          }}
        >
          {setupMode && (
            <div>
              <Label className="text-xs">Username (optional, just a label)</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          )}
          <div>
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={setupMode ? "at least 8 characters" : ""}
              autoComplete={setupMode ? "new-password" : "current-password"}
              autoFocus
              required
              minLength={setupMode ? 8 : 1}
            />
          </div>
          {setupMode && (
            <div>
              <Label className="text-xs">Confirm password</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={setup.isPending || doLogin.isPending || !pw}
            style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            title={setupMode ? "Set the admin password and sign in." : "Sign in to the dashboard."}
          >
            {setup.isPending || doLogin.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : setupMode ? (
              <ShieldPlus className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {setupMode ? "Set password & sign in" : "Sign in"}
          </Button>

          {!setupMode && (
            <p className="text-center text-[11px] text-muted-foreground">
              Forgot it? Delete <code>ADMIN_PASSWORD_HASH</code> from the <code>app_settings</code>{" "}
              table, then reload — you'll see the setup screen again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
