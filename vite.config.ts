import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { piperTTSPlugin } from "./src/lib/vite-piper-plugin";

export default defineConfig({
  plugins: [react(), piperTTSPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@remotion/google-fonts")) return "remotion-fonts";
          if (id.includes("remotion") || id.includes("@remotion")) return "remotion-core";
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
