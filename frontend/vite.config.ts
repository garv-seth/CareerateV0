import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.repl.co'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_B2C_CLIENT_ID': JSON.stringify(process.env.B2C_CLIENT_ID),
    'import.meta.env.VITE_B2C_TENANT_NAME': JSON.stringify(process.env.B2C_TENANT_NAME),
    'import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME': JSON.stringify(process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME),
  }
})
