import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

const mode = process.env["NODE_ENV"] === "production" ? "production" : "development";
const env = loadEnv(mode, process.cwd(), "");

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    hmr: process.env["DISABLE_HMR"] !== "true",
    watch: process.env["DISABLE_HMR"] === "true" ? null : {},
    proxy: {
      "/backend-api": {
        target: env["VITE_API_URL"] || "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/backend-api/, ""),
      },
    },
  },
});
