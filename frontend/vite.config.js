// =============================================================
// vite.config.js
// -------------------------------------------------------------
// Basic Vite configuration enabling the React plugin.
// Vite is a fast build tool/dev server for modern frontend apps.
// =============================================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // default Vite dev server port
  },
});
