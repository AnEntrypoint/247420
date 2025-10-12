import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

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
            function copyRecursive(src, dest) {
              const stat = statSync(src)
              if (stat.isDirectory()) {
                if (!existsSync(dest)) {
                  mkdirSync(dest, { recursive: true })
                }
                const files = readdirSync(src)
                files.forEach(file => {
                  copyRecursive(join(src, file), join(dest, file))
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