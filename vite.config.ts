import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const INJECTED_HEAD_SCRIPTS_ID = "tanstack-start-injected-head-scripts:v";

const dbStubPath = path.resolve(__dirname, "./src/server/db/empty-stub.ts");

const clientDbStub: Plugin = {
  name: "client-db-stub",
  enforce: "pre",
  resolveId(source, _importer, options) {
    if (options.ssr) return null;
    if (source === "postgres" || source.startsWith("postgres/")) {
      return dbStubPath;
    }
    if (source.includes("server/db/client") || source.includes("server/db/repos")) {
      return dbStubPath;
    }
    return null;
  },
};

const injectedHeadScriptsShim: Plugin = {
  name: "tanstack-start-injected-head-scripts-shim",
  enforce: "pre",
  resolveId(id) {
    return id === INJECTED_HEAD_SCRIPTS_ID ? id : undefined;
  },
  load(id) {
    return id === INJECTED_HEAD_SCRIPTS_ID
      ? "export const injectedHeadScripts = undefined;"
      : undefined;
  },
};

/** Self-hosted TanStack Start — Node.js on Kloudbean (no Lovable, no Cloudflare Workers). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
  plugins: [
    clientDbStub,
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: { build: "mock", dev: "mock" },
      },
    }),
    viteReact(),
    tailwindcss(),
    injectedHeadScriptsShim,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    host: true,
  },
  preview: {
    port: Number(process.env.PORT) || 3000,
    host: true,
  },
};
});
