import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lore: resolve(__dirname, 'lore.html'),
        gallery: resolve(__dirname, 'images-thread.html'),
        videos: resolve(__dirname, 'videos-thread.html')
      }
    }
  },
  server: {
    port: 3000
  }
})