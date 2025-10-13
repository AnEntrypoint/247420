import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

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

          // Copy lore.css if it exists
          const loreCssFile = resolve(__dirname, 'lore.css')
          if (existsSync(loreCssFile)) {
            copyFileSync(loreCssFile, resolve(__dirname, 'dist', 'lore.css'))
            console.log('✅ Copied lore.css')
          }

          // Copy navbar files if they exist
          const navbarFile = resolve(__dirname, 'navbar.html')
          if (existsSync(navbarFile)) {
            copyFileSync(navbarFile, resolve(__dirname, 'dist', 'navbar.html'))
            console.log('✅ Copied navbar.html')
          }

          const navbarCssFile = resolve(__dirname, 'navbar.css')
          if (existsSync(navbarCssFile)) {
            copyFileSync(navbarCssFile, resolve(__dirname, 'dist', 'navbar.css'))
            console.log('✅ Copied navbar.css')
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