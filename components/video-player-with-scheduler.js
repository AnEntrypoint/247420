/**
 * Enhanced Video Player with Scheduler Integration
 * Integrates the 247420 scheduler with the existing video player functionality
 */

import Schwelevision from '420kit-shared/schwelevision';

class EnhancedVideoPlayer {
    constructor() {
        // Existing video player properties
        this.videos = [];
        this.currentVideoIndex = 0;
        this.volume = 50;
        this.isPlaying = false;
        this.isBuffering = false;

        // Scheduler integration using 420kit Schwelevision
        this.schwelevision = null;
        this.currentScheduledVideo = null;
        this.adBreaks = [];
        this.isAdPlaying = false;

        // Loop scheduling
        this.loopSchedule = [];
        this.loopDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
        this.epochStart = Date.now();
        this.currentProgramIndex = 0;

        // DOM elements
        this.videoElement = null;
        this.nowPlaying = null;
        this.loadingText = null;

        // Initialize Schwelevision
        this.initializeSchwelevision();
    }

    /**
     * Initialize the Schwelevision scheduler from 420kit
     */
    async initializeSchwelevision() {
        this.schwelevision = new Schwelevision({
            videoElement: 'tvVideo',
            nowPlayingElement: 'nowPlaying',
            loadingElement: 'loadingText',
            schedulePath: '/public/schedule_weeks/',
            fallbackToSaved: true,
            enableAudio: true
        });

        try {
            await this.schwelevision.initialize();
            console.log('✅ Schwelevision initialized successfully');

            // Schwelevision handles all video scheduling and playback internally
            // We can monitor its state through its status methods
        } catch (error) {
            console.error('❌ Failed to initialize Schwelevision:', error);
        }
    }

    /**
     * Initialize the video player
     */
    async initialize() {
        console.log('🚀 Initializing Enhanced Video Player with 420kit Schwelevision...');

        // Schwelevision handles all video setup, loading, and playback
        // Just ensure DOM elements are available
        this.videoElement = document.getElementById('tvVideo');
        this.nowPlaying = document.getElementById('nowPlaying');
        this.loadingText = document.getElementById('loadingText');

        if (!this.videoElement) {
            console.error('❌ Video element not found');
            return;
        }

        console.log('✅ Enhanced Video Player initialized with 420kit Schwelevision');
    }

    /**
     * Setup video player event listeners
     */
    setupVideoPlayer() {
        this.videoElement.addEventListener('loadedmetadata', () => {
            console.log('📺 Video metadata loaded');
            this.isBuffering = false;
            if (this.loadingText) {
                this.loadingText.style.display = 'none';
            }
        });

        this.videoElement.addEventListener('canplay', () => {
            console.log('📺 Video can play');
        });

        this.videoElement.addEventListener('error', (e) => {
            console.error('❌ Video error:', e);
            this.handleVideoError(e);
        });

        this.videoElement.addEventListener('ended', () => {
            console.log('📺 Video ended');
            this.playNextVideo();
        });

        this.videoElement.addEventListener('timeupdate', () => {
            this.checkForAdBreaks();
        });
    }

    /**
     * Load videos from saved_videos.json
     */
    async loadVideos() {
        try {
            const response = await fetch('/saved_videos.json');
            if (!response.ok) throw new Error('Failed to fetch videos');

            const videosData = await response.json();

            // Convert to array format
            this.videos = Object.keys(videosData).map(filename => ({
                filename: filename,
                ...videosData[filename]
            }));

            console.log(`📼 Loaded ${this.videos.length} videos`);

            // Update scheduler with loaded videos
            if (this.scheduler) {
                this.scheduler.savedVideos = videosData;
            }

        } catch (error) {
            console.error('❌ Error loading videos:', error);
            this.videos = [];
        }
    }

    /**
     * Create loop schedule for continuous playback
     */
    createLoopSchedule() {
        if (this.videos.length === 0) return;

        this.loopSchedule = [];
        let offsetMs = 0;

        // Create continuous loop from available videos
        while (offsetMs < this.loopDuration) {
            for (const video of this.videos) {
                if (offsetMs >= this.loopDuration) break;

                const duration = (video.duration || 30) * 1000;
                this.loopSchedule.push({
                    filename: video.filename,
                    duration: duration,
                    offsetMs: offsetMs,
                    videoIndex: this.videos.findIndex(v => v.filename === video.filename)
                });

                offsetMs += duration + 2000; // 2 second gap between videos
            }
        }

        console.log(`📺 Created loop schedule with ${this.loopSchedule.length} slots`);
    }

    /**
     * Start the hybrid broadcast system
     */
    async startHybridBroadcast() {
        console.log('📡 Starting hybrid broadcast...');

        try {
            // Try to get scheduled video first
            const scheduledVideo = await this.scheduler?.getNextVideo();

            if (scheduledVideo && scheduledVideo.source === 'scheduled') {
                console.log('📅 Playing scheduled content');
                await this.playScheduledVideo(scheduledVideo);
            } else {
                // No scheduled content, play regular content
                console.log('📺 No scheduled content, playing regular programming');
                await this.playNextVideo();
            }

        } catch (error) {
            console.error('❌ Error starting broadcast:', error);
            await this.playNextVideo();
        }
    }

    /**
     * Play a scheduled video
     */
    async playScheduledVideo(scheduledVideo) {
        this.currentScheduledVideo = scheduledVideo;
        this.adBreaks = scheduledVideo.adBreaks || [];

        // Prioritize external archive.org URLs for scheduled videos
        const videoPath = scheduledVideo.u || `/saved_videos/${scheduledVideo.filename}`;

        console.log(`📅 Playing scheduled video with priority URL: ${videoPath}`);
        console.log(`📅 Video source: ${scheduledVideo.u ? 'External archive.org' : 'Local fallback'}`);

        try {
            // Create a temporary video element for pre-loading
            const tempVideo = document.createElement('video');
            tempVideo.src = videoPath;
            tempVideo.volume = 0;
            tempVideo.muted = true;

            // Wait for the video to load metadata
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Video loading timeout'));
                }, 10000); // 10 second timeout

                tempVideo.addEventListener('loadedmetadata', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });

                tempVideo.addEventListener('error', (e) => {
                    clearTimeout(timeout);
                    reject(e);
                }, { once: true });

                tempVideo.load();
            });

            // Check if video can actually play
            if (tempVideo.duration && !isNaN(tempVideo.duration)) {
                // Video loaded successfully, use it
                this.videoElement.src = videoPath;
                this.videoElement.currentTime = scheduledVideo.position || 0;
                this.videoElement.volume = this.volume / 100;
                this.videoElement.muted = this.volume === 0;

                await this.videoElement.play();

                this.isPlaying = true;
                this.updateNowPlaying(scheduledVideo, 'scheduled');

                console.log(`📅 Playing scheduled video: ${scheduledVideo.show || scheduledVideo.filename}`);
                console.log(`📅 Source: ${videoPath}`);
            } else {
                throw new Error('Video has no duration or invalid');
            }

        } catch (error) {
            console.error('❌ Error playing scheduled video:', error);
            console.log(`📅 Failed to load: ${videoPath}`);

            // Fallback to regular content (saved videos)
            console.log('📅 Falling back to saved videos...');
            await this.playNextVideo();
        }
    }

    
    /**
     * Play the next video in the sequence
     */
    async playNextVideo() {
        this.currentScheduledVideo = null;
        this.adBreaks = [];
        this.isAdPlaying = false;

        // Get next video from scheduler
        const nextVideo = await this.scheduler?.getNextVideo();

        if (nextVideo && nextVideo.source !== 'saved_videos') {
            // We have scheduled or static content
            if (nextVideo.source === 'scheduled') {
                await this.playScheduledVideo(nextVideo);
            } else {
                await this.playVideo(nextVideo);
            }
        } else {
            // Use regular loop schedule
            const now = Date.now();
            const elapsedSinceEpoch = now - this.epochStart;
            const currentLoopPosition = elapsedSinceEpoch % this.loopDuration;

            const currentSlot = this.loopSchedule.find(slot =>
                currentLoopPosition >= slot.offsetMs &&
                currentLoopPosition < slot.offsetMs + slot.duration
            );

            if (currentSlot) {
                this.currentProgramIndex = this.loopSchedule.indexOf(currentSlot);
                const video = this.videos[currentSlot.videoIndex];
                await this.playVideo(video);
            } else {
                // Fallback to next video in loop
                this.currentProgramIndex = (this.currentProgramIndex + 1) % this.loopSchedule.length;
                const slot = this.loopSchedule[this.currentProgramIndex];
                const video = this.videos[slot.videoIndex];
                await this.playVideo(video);
            }
        }
    }

    /**
     * Play a video
     */
    async playVideo(video) {
        if (!video || !video.filename) {
            console.error('❌ Invalid video data');
            return;
        }

        try {
            // Handle different content sources
            let videoPath;
            if (video.source === 'static') {
                videoPath = '/static.mp4'; // Static/noise effect
            } else {
                videoPath = `/saved_videos/${video.filename}`;
            }

            this.videoElement.src = videoPath;
            this.videoElement.volume = this.volume / 100;
            this.videoElement.muted = this.volume === 0;

            await this.videoElement.play();

            this.isPlaying = true;
            this.updateNowPlaying(video, video.source || 'regular');

            console.log(`📺 Playing video: ${video.title || video.filename} from ${videoPath}`);

        } catch (error) {
            console.error('❌ Error playing video:', error);
            this.handleVideoError(error);
        }
    }

    /**
     * Check for ad breaks during playback
     */
    checkForAdBreaks() {
        if (!this.adBreaks || this.adBreaks.length === 0 || this.isAdPlaying) {
            return;
        }

        const currentTime = this.videoElement.currentTime;

        // Find next ad break
        const nextAdBreak = this.adBreaks.find(ad =>
            Math.abs(ad.position - currentTime) < 1 && !ad.played
        );

        if (nextAdBreak) {
            this.playAdBreak(nextAdBreak);
        }
    }

    /**
     * Play an ad break
     */
    async playAdBreak(adBreak) {
        console.log('📺 Playing ad break');

        // Mark ad as played
        adBreak.played = true;
        this.isAdPlaying = true;

        // Save current video position
        const savedPosition = this.videoElement.currentTime;
        const savedVolume = this.videoElement.volume;

        try {
            await this.playVideo(adBreak.video);
            this.updateNowPlaying(adBreak.video, 'ad');

            // Set timeout to resume original video after ad
            setTimeout(async () => {
                this.isAdPlaying = false;

                // Resume original video
                if (this.currentScheduledVideo) {
                    this.videoElement.currentTime = savedPosition;
                    this.videoElement.volume = savedVolume;
                    await this.videoElement.play();
                    this.updateNowPlaying(this.currentScheduledVideo, 'scheduled');
                } else {
                    await this.playNextVideo();
                }
            }, (adBreak.video.duration || 30) * 1000);

        } catch (error) {
            console.error('❌ Error playing ad:', error);
            this.isAdPlaying = false;
            // Resume original content
            this.videoElement.currentTime = savedPosition;
            this.videoElement.volume = savedVolume;
            await this.videoElement.play();
        }
    }

    /**
     * Update now playing display
     */
    updateNowPlaying(video, source) {
        if (!this.nowPlaying) return;

        let icon = '📺';
        let sourceLabel = '';

        switch (source) {
            case 'scheduled':
                icon = '📅';
                sourceLabel = 'SCHEDULED';
                break;
            case 'scheduled-local':
                icon = '📅';
                sourceLabel = 'SCHEDULED (LOCAL)';
                break;
            case 'ad':
                icon = '📢';
                sourceLabel = 'ADVERTISEMENT';
                break;
            case 'saved_videos':
                icon = '📼';
                sourceLabel = 'SAVED CLIP';
                break;
            case 'static':
                icon = '📺';
                sourceLabel = 'STATIC/NOISE';
                break;
            default:
                icon = '📺';
                sourceLabel = 'REGULAR';
        }

        const title = video.show || video.title || video.filename || 'Unknown';
        this.nowPlaying.innerHTML = `${icon} NOW PLAYING: ${title} [${sourceLabel}]`;
    }

    /**
     * Handle video errors
     */
    handleVideoError(error) {
        console.error('❌ Video playback error:', error);

        // Try to play next video
        setTimeout(() => {
            this.playNextVideo();
        }, 2000);
    }

    /**
     * Get current scheduler status
     */
    getSchedulerStatus() {
        return this.schwelevision?.getStatus() || {
            hasWeeklySchedule: false,
            hasSavedVideos: false,
            hasStaticSchedule: false,
            isScheduledVideoPlaying: !!this.currentScheduledVideo,
            isBufferingScheduledVideo: false,
            schwelevisionActive: !!this.schwelevision
        };
    }

    /**
     * Force check for scheduled content
     */
    async checkForScheduledContent() {
        if (!this.schwelevision) return;

        // Schwelevision handles scheduled content detection automatically
        // We can trigger a refresh if needed
        const status = this.schwelevision.getStatus();
        console.log('📅 Schwelevision status:', status);
    }
}

// Export for use in main application
window.EnhancedVideoPlayer = EnhancedVideoPlayer;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.videoPlayer = new EnhancedVideoPlayer();
        window.videoPlayer.initialize();
    });
} else {
    window.videoPlayer = new EnhancedVideoPlayer();
    window.videoPlayer.initialize();
}

export default EnhancedVideoPlayer;