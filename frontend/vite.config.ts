import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react(), visualizer({ open: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8081',
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_B2C_CLIENT_ID': JSON.stringify(process.env.B2C_CLIENT_ID),
    'import.meta.env.VITE_B2C_TENANT_NAME': JSON.stringify(process.env.B2C_TENANT_NAME),
    'import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME': JSON.stringify(process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME),
  }
})
