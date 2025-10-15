import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development'

async function createServer() {
  const app = express()

  // Serve static files
  app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')))
  app.use('/saved_videos', express.static(path.join(__dirname, 'saved_videos')))
  app.use('/schedule_weeks', express.static(path.join(__dirname, 'schedule_weeks')))
  app.use('/public', express.static(path.join(__dirname, 'public')))
  app.use(express.static(path.join(__dirname, 'dist')))

  // Serve JSON files directly
  app.get('/saved_videos.json', (req, res) => {
    const filePath = path.join(__dirname, 'saved_videos.json')
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath)
    } else {
      res.json([])
    }
  })

  app.get('/saved_images.json', (req, res) => {
    const filePath = path.join(__dirname, 'saved_images.json')
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath)
    } else {
      res.json([])
    }
  })

  // API routes for media
  app.get('/api/saved-images', async (req, res) => {
    try {
      const imagesDir = path.join(__dirname, 'saved_images')
      if (!fs.existsSync(imagesDir)) {
        return res.json([])
      }

      const files = fs.readdirSync(imagesDir)
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)
      })

      const imageData = imageFiles.map(file => {
        const filePath = path.join(imagesDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      }).sort((a, b) => new Date(b.created) - new Date(a.created))

      res.json(imageData)
    } catch (error) {
      console.error('Error serving images API:', error)
      res.json([])
    }
  })

  app.get('/api/saved-videos', async (req, res) => {
    try {
      const videosDir = path.join(__dirname, 'saved_videos')
      if (!fs.existsSync(videosDir)) {
        return res.json([])
      }

      const files = fs.readdirSync(videosDir)
      const videoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.gif'].includes(ext)
      })

      const videoData = videoFiles.map(file => {
        const filePath = path.join(videosDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      }).sort((a, b) => new Date(b.created) - new Date(a.created))

      res.json(videoData)
    } catch (error) {
      console.error('Error serving videos API:', error)
      res.json([])
    }
  })

  // Development mode: use Vite dev server
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })

    app.use(vite.middlewares)
  }

  // Serve HTML files with SSR if available
  const htmlFiles = ['index.html', 'images-thread.html', 'lore.html', 'videos-thread.html', 'gallery.html']

  htmlFiles.forEach(file => {
    app.get(`/${file === 'index.html' ? '' : file.replace('.html', '')}`, async (req, res) => {
      try {
        let html
        if (isDev) {
          html = await fs.promises.readFile(path.join(__dirname, file), 'utf-8')
          html = await vite.transformIndexHtml(req.url, html)
        } else {
          html = await fs.promises.readFile(path.join(__dirname, 'dist', file), 'utf-8')
        }
        res.setHeader('Content-Type', 'text/html')
        res.send(html)
      } catch (error) {
        console.error(`Error serving ${file}:`, error)
        res.status(500).send('Server Error')
      }
    })
  })

  // Fallback for 404
  app.use('*', (req, res) => {
    res.status(404).send('Page not found')
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
    console.log(`Environment: ${isDev ? 'development' : 'production'}`)
  })
}

createServer().catch(console.error)