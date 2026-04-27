import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { piperTTSPlugin } from "./src/lib/vite-piper-plugin";

export default defineConfig({
  plugins: [react(), piperTTSPlugin()],
  build: {
    // Remotion fonts pull remotion-core, which avoids a fully isolated split.
    // We accept a larger remotion bundle as a single "remotion" chunk and lift
    // the warning ceiling to silence cosmetic alerts.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@remotion/google-fonts") || id.includes("@remotion") || id.includes("remotion")) {
            return "remotion";
          }
          if (id.includes("framer-motion")) return "motion";
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api/openai": {
        target: "https://api.openai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ""),
      },
      "/api/google-genai": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-genai/, ""),
      },
      "/api/google-tts": {
        target: "https://texttospeech.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-tts/, ""),
      },
      "/api/anthropic": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
      },
      "/api/pexels": {
        target: "https://api.pexels.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pexels/, ""),
      },
      "/api/pixabay/videos": {
        target: "https://pixabay.com/api/videos",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pixabay\/videos/, ""),
      },
      "/api/pixabay": {
        target: "https://pixabay.com/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pixabay/, ""),
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
