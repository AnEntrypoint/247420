import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function buildSSR() {
  console.log('🚀 Starting SSR build process...')

  try {
    // Step 0: Build media lists (images and videos)
    console.log('📋 Building media lists...')
    await buildMediaLists()

    // Step 1: Build client-side assets
    console.log('🔨 Building client-side assets...')
    await build({
      configFile: path.join(__dirname, 'vite.config.ssr.js'),
      mode: 'production'
    })

    // Step 2: Copy static files
    console.log('📁 Copying static files...')
    const staticFiles = [
      'logo.gif',
      'favicon.ico',
      'navbar.html',
      'navbar.css',
      'lore.css',
      'style.css'
    ]

    staticFiles.forEach(file => {
      const src = path.join(__dirname, file)
      const dest = path.join(__dirname, 'dist', file)
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log(`✅ Copied ${file}`)
      }
    })

    // Step 3: Copy directories and static content
    const directories = ['saved_images', 'saved_videos', 'public', 'static', 'components']
    directories.forEach(dir => {
      const src = path.join(__dirname, dir)
      const dest = path.join(__dirname, 'dist', dir)
      if (fs.existsSync(src)) {
        copyDirectory(src, dest)
        console.log(`✅ Copied ${dir}/`)
      }
    })

    console.log('🎉 SSR build completed successfully!')
    console.log('📦 Ready for deployment with node server.js')

  } catch (error) {
    console.error('❌ SSR build failed:', error)
    process.exit(1)
  }
}

async function buildMediaLists() {
  try {
    const MediaBuilder = (await import('./scripts/build-media-lists.js')).default
    const builder = new MediaBuilder()
    await builder.build()
  } catch (error) {
    console.error('❌ Failed to build media lists:', error)
    // Continue with build even if media lists fail
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

buildSSR()