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
      },
      output: {
        manualChunks: {
          'components': [
            'dist/components/theme.css',
            'dist/components/base.css',
            'dist/components/animations.css',
            'dist/components/navbar-unified.css',
            'dist/components/cards.css',
            'dist/components/buttons.css',
            'dist/components/utilities.css',
            'dist/components/loader.css'
          ],
          'vendor': [
            // Add any third-party dependencies here
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
            return `assets/media/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.css$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        }
      }
    },
    emptyOutDir: false,
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000
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