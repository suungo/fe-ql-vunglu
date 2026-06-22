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
    allowedHosts: [
      'ql-vunglu.site'
    ],
    watch: {
      usePolling: true, // Bật chế độ quét vòng (polling) để khắc phục lỗi hệ điều hành Windows không báo sự kiện thay đổi file cho Vite
    },
    // hmr: { host: '192.168.100.27' }, // bỏ comment nếu dùng mạng LAN
    // proxy: {
    //   '/geoserver': {
    //     target: 'https://ql-vunglu.site/geoserver',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
})
