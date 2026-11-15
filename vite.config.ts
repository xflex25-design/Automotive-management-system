// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const mode = process.env["NODE_ENV"] === "production" ? "production" : "development";
const env = loadEnv(mode, process.cwd(), "");

export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      proxy: {
        "/backend-api": {
          target: env["VITE_API_URL"] || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/backend-api/, ""),
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
