import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      host: '192.168.100.27',
    },
    proxy: {
      '/geoserver': {
        target: 'http://192.168.100.27:8000',
        changeOrigin: true,
        secure: false,
      },

    },

  },
})
