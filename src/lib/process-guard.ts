import "@tanstack/react-start/server-only";

/**
 * PROCESS GUARD — stops a transient network blip from killing the whole server.
 *
 * WHY THIS EXISTS. The dev server died mid-run with this:
 *
 *   node:events:487  throw er; // Unhandled 'error' event
 *   Error: read EADDRNOTAVAIL
 *       at TLSWrap.onStreamRead
 *   Emitted 'error' event on ClientHttp2Stream instance
 *
 * That is an outbound AI call whose HTTP/2 socket dropped. It is emitted as an
 * EventEmitter 'error', not a rejected promise, so no try/catch anywhere up the
 * stack can catch it. Node's default for an unhandled 'error' event is to kill
 * the process. Every careful try/catch in job-runner.ts is bypassed.
 *
 * This mattered much less before the growth autopilot, because AI calls only
 * happened while somebody was watching a screen and could just click again. Now
 * trends, threads and reply drafting run unattended on a cadence, so the failure
 * mode became: one dropped socket at 3am, and the server is down until someone
 * notices in the morning. The queue is durable, so the work would survive; the
 * process would not.
 *
 * WHAT IT DOES NOT DO: swallow errors generally. A blanket uncaughtException
 * handler that keeps running is a genuinely bad idea, because after a real bug
 * (a TypeError mid-write, say) the process is in an unknown state and carrying on
 * can corrupt data. So this only continues for a known allowlist of transient
 * socket and DNS failures, where the only casualty is one outbound request. For
 * anything else it logs and exits, preserving normal fail-fast behaviour.
 */

/** Transient network failures. One request is lost; process state is still sound. */
const TRANSIENT = new Set([
  "EADDRNOTAVAIL", // the crash we actually saw: no local address available
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN", // DNS temporarily unavailable
  "ERR_STREAM_PREMATURE_CLOSE",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
]);

function isTransientNetwork(err: unknown): boolean {
  const e = err as { code?: string; message?: string; syscall?: string } | null;
  if (!e) return false;
  if (e.code && TRANSIENT.has(e.code)) return true;
  // HTTP/2 stream teardown surfaces as a family of ERR_HTTP2_* codes.
  if (e.code && e.code.startsWith("ERR_HTTP2_")) return true;
  // Undici wraps socket failures with a generic code and a telling message.
  const m = String(e.message ?? "");
  if (/socket hang up|other side closed|terminated|fetch failed/i.test(m)) return true;
  return false;
}

const g = globalThis as typeof globalThis & { __seoProcessGuard?: boolean };

/**
 * Install once per process. Called from ensureJobRunner(), which is exactly the
 * point where unattended outbound work starts happening.
 */
export function installProcessGuard(): void {
  if (g.__seoProcessGuard) return;
  g.__seoProcessGuard = true;

  process.on("uncaughtException", (err) => {
    if (isTransientNetwork(err)) {
      console.warn(
        `[process-guard] Ignored transient network error (${(err as NodeJS.ErrnoException).code ?? "unknown"}): ${err.message}. ` +
          `One outbound request was lost; the queue will retry it.`,
      );
      return;
    }
    // A real bug. Log it properly and let the process die, because continuing
    // from an unknown state is worse than restarting.
    console.error("[process-guard] Fatal uncaught exception, exiting:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    if (isTransientNetwork(reason)) {
      console.warn(
        `[process-guard] Ignored transient network rejection: ${String((reason as Error)?.message ?? reason)}`,
      );
      return;
    }
    // Unlike an uncaught exception, a stray rejection usually leaves the process
    // healthy, so log loudly and keep serving rather than dropping requests.
    console.error("[process-guard] Unhandled promise rejection:", reason);
  });

  console.log("[process-guard] Installed (transient network errors will not kill the server).");
}
