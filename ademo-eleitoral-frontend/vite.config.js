import { defineConfig, loadEnv } from 'vite'
import { cwd } from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(({ mode }) => {
  const backendTarget = loadEnv(mode, cwd(), 'ADEMO_').ADEMO_BACKEND_DEV_URL || 'http://127.0.0.1:8000'

  return {
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['ruse-laborious-debtor.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        xfwd: true,
      },
      '/storage': {
        target: backendTarget,
        changeOrigin: true,
        xfwd: true,
      },
      '/candidate-photos': {
        target: backendTarget,
        changeOrigin: true,
        xfwd: true,
      },
      '/candidate-documents': {
        target: backendTarget,
        changeOrigin: true,
        xfwd: true,
      },
      '/app': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
        xfwd: true,
      },
    },
  },
  }
})
