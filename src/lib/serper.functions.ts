import { createServerFn } from "@tanstack/react-start";

export const testSerperConnectionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { testSerperConnection } = await import("./serper-client");
  return testSerperConnection();
});
