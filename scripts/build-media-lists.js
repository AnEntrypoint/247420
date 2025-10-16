#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MediaBuilder {
    constructor() {
        this.rootPath = path.resolve(__dirname, '..');
        this.imagesPath = path.join(this.rootPath, 'saved_images');
        this.videosPath = path.join(this.rootPath, 'saved_videos');
        this.imagesJsonPath = path.join(this.rootPath, 'saved_images.json');
        this.videosJsonPath = path.join(this.rootPath, 'saved_videos.json');
    }

    async buildImagesList() {
        try {
            const images = [];

            if (!fs.existsSync(this.imagesPath)) {
                console.log('Images directory does not exist, creating empty list');
                fs.writeFileSync(this.imagesJsonPath, JSON.stringify([], null, 2));
                return images;
            }

            const files = fs.readdirSync(this.imagesPath);

            for (const file of files) {
                const filePath = path.join(this.imagesPath, file);
                const stats = fs.statSync(filePath);

                if (stats.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
                    // Extract date from filename or use file modification time
                    let date = stats.mtime.toISOString();

                    // Try to extract date from filename pattern
                    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-\d+Z)?)/);
                    if (dateMatch) {
                        date = dateMatch[1].replace(/-(\d+)Z$/, ':$1Z');
                    }

                    images.push({
                        filename: file,
                        date: date,
                        size: stats.size
                    });
                }
            }

            // Sort by date descending
            images.sort((a, b) => new Date(b.date) - new Date(a.date));

            fs.writeFileSync(this.imagesJsonPath, JSON.stringify(images, null, 2));
            console.log(`Built images list with ${images.length} items`);
            return images;

        } catch (error) {
            console.error('Error building images list:', error);
            return [];
        }
    }

    async buildVideosList() {
        try {
            const videos = [];

            if (!fs.existsSync(this.videosPath)) {
                console.log('Videos directory does not exist, creating empty list');
                fs.writeFileSync(this.videosJsonPath, JSON.stringify([], null, 2));
                return videos;
            }

            const files = fs.readdirSync(this.videosPath);

            for (const file of files) {
                const filePath = path.join(this.videosPath, file);
                const stats = fs.statSync(filePath);

                if (stats.isFile() && /\.(mp4|webm|mov|avi)$/i.test(file)) {
                    // Extract date from filename or use file modification time
                    let date = stats.mtime.toISOString();

                    // Try to extract date from filename pattern
                    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-\d+Z)?)/);
                    if (dateMatch) {
                        date = dateMatch[1].replace(/-(\d+)Z$/, ':$1Z');
                    }

                    // Determine category from filename
                    let category = 'general';
                    if (/meme|schwepe|schwill|drftnrough|quadrillions/i.test(file)) {
                        category = 'meme';
                    } else if (/timeline|render|export/i.test(file)) {
                        category = 'production';
                    }

                    videos.push({
                        filename: file,
                        path: `saved_videos/${file}`,
                        date: date,
                        extension: path.extname(file),
                        type: 'video',
                        metadata: {
                            size: stats.size,
                            created: stats.birthtime.toISOString(),
                            modified: stats.mtime.toISOString(),
                            accessed: stats.atime.toISOString()
                        },
                        category: category
                    });
                }
            }

            // Sort by date descending
            videos.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Convert to object format expected by frontend (filename as key)
            const videosObject = {};
            videos.forEach(video => {
                videosObject[video.filename] = {
                    ...video,
                    title: video.filename.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-\d+Z)?_)/, '').replace(/\.mp4$/, ''),
                    description: `Video from ${video.date}`,
                    duration: 30 // Default duration in seconds
                };
            });

            fs.writeFileSync(this.videosJsonPath, JSON.stringify(videosObject, null, 2));
            console.log(`Built videos list with ${videos.length} items`);
            return videos;

        } catch (error) {
            console.error('Error building videos list:', error);
            return [];
        }
    }

    async build() {
        console.log('Building media lists...');
        await this.buildImagesList();
        await this.buildVideosList();
        console.log('Media lists built successfully!');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const builder = new MediaBuilder();
    builder.build().catch(console.error);
}

export default MediaBuilder;