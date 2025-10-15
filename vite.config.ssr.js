import { defineConfig } from 'vite'
import { resolve } from 'path'

// SSR-compatible Vite configuration
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        lore: resolve(__dirname, 'lore.html'),
        videosThread: resolve(__dirname, 'videos-thread.html'),
        imagesThread: resolve(__dirname, 'images-thread.html')
      }
    },
    emptyOutDir: false,
    assetsInlineLimit: 0,
    target: 'esnext',
    minify: 'esbuild'
  },

  // SSR configuration
  ssr: {
    noExternal: [],
    target: 'node'
  },

  server: {
    port: 3000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false
    },
    host: true
  },

  preview: {
    port: 4173,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false
    },
    host: true
  },

  // Optimized dependencies
  optimizeDeps: {
    include: []
  },

  // CSS processing
  css: {
    devSourcemap: true
  }
})