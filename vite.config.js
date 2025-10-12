import { defineConfig } from 'vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle: {
        sequential: true,
        handler() {
          console.log('Copying static assets...')

          // Copy logo.gif if it exists
          const logoFile = resolve(__dirname, 'logo.gif')
          if (existsSync(logoFile)) {
            copyFileSync(logoFile, resolve(__dirname, 'dist', 'logo.gif'))
            console.log('✅ Copied logo.gif')
          }

          // Copy any other static assets from public folder
          const publicDir = resolve(__dirname, 'public')
          if (existsSync(publicDir)) {
            const fs = require('fs')
            const path = require('path')

            function copyRecursive(src, dest) {
              const stat = fs.statSync(src)
              if (stat.isDirectory()) {
                if (!fs.existsSync(dest)) {
                  fs.mkdirSync(dest, { recursive: true })
                }
                const files = fs.readdirSync(src)
                files.forEach(file => {
                  copyRecursive(path.join(src, file), path.join(dest, file))
                })
              } else {
                copyFileSync(src, dest)
              }
            }

            copyRecursive(publicDir, resolve(__dirname, 'dist'))
            console.log('✅ Copied public folder')
          }
        }
      }
    }
  ]
})