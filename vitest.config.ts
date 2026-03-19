import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      include: ["src/lib/**", "src/db/**"],
      exclude: [
        "coverage/**",
        "dist/**",
        "packages/*/test{,s}/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.*",
        "**/*.spec.*",
        "**/node_modules/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "**/*.test.{js,jsx,ts,tsx}",
        "**/__tests__/**",
        "src/app/**",
        "src/lib/api/**",
      ],
      thresholds: {
        statements: 60,
        functions: 54,
        branches: 60,
        lines: 60,
      },
    },
    globals: true,
    setupFiles: ["./src/__tests__/helpers/setupStorage.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
