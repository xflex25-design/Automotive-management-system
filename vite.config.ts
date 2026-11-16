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
    proxy: {
      "/backend-api": {
        target: env["VITE_API_URL"] || "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/backend-api/, ""),
      },
    },
  },
});
