import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs'
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
      name: 'build-components',
      buildStart() {
        console.log('🔨 Building component system...')
      }
    },
    {
      name: 'copy-static-files',
      closeBundle: {
        sequential: true,
        handler() {
          console.log('📦 Copying additional static files...')

          // Create component manifest
          const componentManifest = {
            version: '1.0.0',
            components: ['navbar', 'footer', 'media-grid'],
            lastBuilt: new Date().toISOString()
          }
          writeFileSync(
            resolve(__dirname, 'dist', 'component-manifest.json'),
            JSON.stringify(componentManifest, null, 2)
          )
          console.log('✅ Created component manifest')

          // Copy JSON files
          const jsonFiles = ['saved_images.json', 'saved_media.json', 'saved_videos.json']
          jsonFiles.forEach(file => {
            const srcFile = resolve(__dirname, file)
            if (existsSync(srcFile)) {
              copyFileSync(srcFile, resolve(__dirname, 'dist', file))
              console.log(`✅ Copied ${file}`)
            }
          })

          // Copy components directory
          const componentsDir = resolve(__dirname, 'dist', 'components')
          if (!existsSync(componentsDir)) {
            mkdirSync(componentsDir, { recursive: true })
          }

          const componentFiles = [
            'components/navbar.js',
            'components/navbar.css',
            'components/base.css',
            'components/loader.js'
          ]
          componentFiles.forEach(file => {
            const srcFile = resolve(__dirname, 'dist', file)
            if (existsSync(srcFile)) {
              copyFileSync(srcFile, srcFile) // Already in dist
              console.log(`✅ Component ready: ${file}`)
            }
          })

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
          const directories = ['saved_images', 'saved_videos', 'public', 'scripts']
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

          // Generate build info
          const buildInfo = {
            buildTime: new Date().toISOString(),
            version: require('./package.json').version,
            environment: process.env.NODE_ENV || 'development',
            components: componentManifest.components,
            assets: {
              images: existsSync(resolve(__dirname, 'dist', 'saved_images')) ?
                readdirSync(resolve(__dirname, 'dist', 'saved_images')).length : 0,
              videos: existsSync(resolve(__dirname, 'dist', 'saved_videos')) ?
                readdirSync(resolve(__dirname, 'dist', 'saved_videos')).length : 0
            }
          }
          writeFileSync(
            resolve(__dirname, 'dist', 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
          )
          console.log('✅ Generated build info')
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