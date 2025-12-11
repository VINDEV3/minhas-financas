import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["api/server/**/*.test.ts", "api/server/**/*.spec.ts"],
  },
});
