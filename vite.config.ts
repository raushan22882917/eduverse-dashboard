import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to remote backend (only when not using local backend)
      '/api': {
        target: 'https://classroom-backend-821372121985.us-central1.run.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error - check if backend is accessible:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-katex', 'react-katex'],
          'chart-vendor': ['recharts'],
          'api-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          'ai-vendor': ['@google/generative-ai'],
          'gesture-vendor': ['@mediapipe/hands', '@mediapipe/camera_utils', '@mediapipe/drawing_utils']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false // Disable sourcemaps in production for smaller bundle
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ]
  }
})