// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          // Only the legacy landing; the new one (pages/landing/) is split by React.lazy.
          // Matching it here would also pull shared libs (framer-motion) into this chunk
          // and make every page preload it.
          if (/[\\/]src[\\/]pages[\\/]LandingPage\.tsx$/.test(id) || id.includes('animated-shader-hero')) {
            return 'chunk-landing';
          }
          if (id.includes('DemoTestPage') || id.includes('DemoResultPage')) {
            return 'chunk-demo';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
  },
})

