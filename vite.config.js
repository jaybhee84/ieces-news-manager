import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Exclude Electron-only modules from renderer bundle
      external: ['electron'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // Tell Vite not to pre-bundle these
    exclude: ['electron'],
  },
})
