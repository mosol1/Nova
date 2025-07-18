import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 1420, // Port expected by Tauri
    strictPort: false, // Allow fallback to other ports if 1420 is busy
    host: true, // Allow external connections
    open: false // Don't auto-open browser when using Tauri
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}); 