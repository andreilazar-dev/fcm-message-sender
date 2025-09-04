import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const isGitHubPages = process.env.VITE_DEPLOY_ENV === 'GH_PAGES'

// https://vitejs.dev/config/
export default defineConfig({
  base: isGitHubPages ? '/fcm-message-sender/' : '/',
  server: {
    host: true,
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});