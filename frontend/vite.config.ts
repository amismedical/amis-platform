import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    sourcemap: true,  // Enable source maps for debugging
    minify: false,    // Disable minification for easier debugging
  },
  server: {
    port: 5173,
  },
})