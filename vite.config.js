import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { dirname, join } from 'path'

function recursiveCopy(src, dest) {
  if (!existsSync(src)) return

  const stats = statSync(src)
  if (stats.isFile()) {
    copyFileSync(src, dest)
  } else if (stats.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true })
    }
    const files = readdirSync(src)
    files.forEach(file => {
      recursiveCopy(join(src, file), join(dest, file))
    })
  }
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lore: resolve(__dirname, 'lore.html'),
        gallery: resolve(__dirname, 'images-thread.html'),
        videosThread: resolve(__dirname, 'videos-thread.html')
      }
    },
    emptyOutDir: false,
    assetsInlineLimit: 0
  },
  plugins: [
    {
      name: 'copy-static-files',
      closeBundle: {
        sequential: true,
        handler() {
          console.log('Copying additional static files...')

          // Copy JSON files
          const jsonFiles = ['saved_images.json', 'saved_media.json', 'saved_videos.json']
          jsonFiles.forEach(file => {
            const srcFile = resolve(__dirname, file)
            if (existsSync(srcFile)) {
              copyFileSync(srcFile, resolve(__dirname, 'dist', file))
              console.log(`✅ Copied ${file}`)
            }
          })

          // Copy navbar files
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

          // Copy CSS files
          const cssFiles = ['style.css', 'lore.css']
          cssFiles.forEach(file => {
            const srcFile = resolve(__dirname, file)
            if (existsSync(srcFile)) {
              copyFileSync(srcFile, resolve(__dirname, 'dist', file))
              console.log(`✅ Copied ${file}`)
            }
          })

          // Copy directories
          const directories = ['saved_images', 'saved_videos', 'public']
          directories.forEach(dir => {
            const srcDir = resolve(__dirname, dir)
            if (existsSync(srcDir)) {
              recursiveCopy(srcDir, resolve(__dirname, 'dist', dir))
              console.log(`✅ Copied ${dir} folder`)
            }
          })

          // Copy logo
          const logoFile = resolve(__dirname, 'logo.gif')
          if (existsSync(logoFile)) {
            copyFileSync(logoFile, resolve(__dirname, 'dist', 'logo.gif'))
            console.log('✅ Copied logo.gif')
          }
        }
      }
    }
  ],
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
  }
})