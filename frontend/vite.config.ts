import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["lucide-react", "tailwindcss"],
          admin: ["./src/pages/admin/*"],
          operator: ["./src/pages/operator/*"],
          venue: ["./src/pages/venue/*"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
