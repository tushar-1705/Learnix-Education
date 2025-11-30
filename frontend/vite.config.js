import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Set Cross-Origin-Opener-Policy to allow Google OAuth popups
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Set Cross-Origin-Embedder-Policy for compatibility
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})

