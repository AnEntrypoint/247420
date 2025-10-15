/**
 * 247420 Video Scheduler
 *
 * Implements schwepe-style scheduling with:
 * - Weekly scheduled programming override
 * - Clip dispersion as ads between scheduled content
 * - Fallback hierarchy: scheduled -> saved_videos -> static
 * - Standalone scheduling without external dependencies
 */

export class VideoScheduler {
    constructor(options = {}) {
        this.options = {
            // Scheduling behavior
            enableScheduledOverride: true,
            enableClipAds: true,
            maxAdsPerHour: 4,
            minAdDuration: 30, // seconds
            maxAdDuration: 120, // seconds

            // File paths
            scheduleWeeksPath: '/public/schedule_weeks',
            savedVideosPath: '/saved_videos.json',
            staticVideosPath: '/static/video-schedule.json',

            // Timezone and scheduling
            timezone: 'UTC',
            scheduleStartDay: 6, // Saturday

            // Fallback behavior
            fallbackToSavedVideos: true,
            fallbackToStatic: true,

            ...options
        };

        // State management
        this.weeklySchedule = null;
        this.scheduleStart = null;
        this.savedVideos = null;
        this.staticVideos = null;
        this.currentSchedule = [];

        // Scheduling state
        this.isScheduledVideoPlaying = false;
        this.isBufferingScheduledVideo = false;
        this.scheduledVideoElement = null;
        this.adBreaks = [];
        this.currentAdBreak = null;

        // Event listeners
        this.eventListeners = new Map();
    }

    /**
     * Initialize the scheduler
     */
    async initialize() {
        console.log('📅 Initializing 247420 Video Scheduler...');

        try {
            // Load all content sources
            await this.loadSavedVideos();
            await this.loadStaticSchedule();
            await this.loadWeeklySchedule();

            console.log('✅ Video Scheduler initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize scheduler:', error);
            return false;
        }
    }

    /**
     * Load saved videos list
     */
    async loadSavedVideos() {
        try {
            const response = await fetch(this.options.savedVideosPath);
            if (!response.ok) throw new Error('Failed to fetch saved videos');

            this.savedVideos = await response.json();
            const videoCount = Object.keys(this.savedVideos).length;
            console.log(`📼 Loaded ${videoCount} saved videos`);
        } catch (error) {
            console.error('❌ Error loading saved videos:', error);
            this.savedVideos = {};
        }
    }

    /**
     * Load static schedule
     */
    async loadStaticSchedule() {
        try {
            const response = await fetch(this.options.staticVideosPath);
            if (!response.ok) {
                console.log('⚠️ No static schedule available');
                this.staticVideos = null;
                return;
            }

            const staticData = await response.json();
            this.staticVideos = staticData;
            console.log('📺 Loaded static schedule');
        } catch (error) {
            console.log('⚠️ No static schedule available:', error.message);
            this.staticVideos = null;
        }
    }

    /**
     * Load weekly schedule from schedule_weeks
     */
    async loadWeeklySchedule() {
        if (!this.options.enableScheduledOverride) {
            console.log('⚠️ Scheduled override disabled');
            return;
        }

        try {
            const now = new Date();
            const weekNumber = this.getWeekNumber(now);
            const year = now.getFullYear();

            // Try to load current week's schedule
            let scheduleUrl = `${this.options.scheduleWeeksPath}/week_${weekNumber}.json`;

            console.log(`📅 Attempting to load schedule: ${scheduleUrl}`);

            const response = await fetch(scheduleUrl);
            if (!response.ok) throw new Error(`Week ${weekNumber} not found`);

            const scheduleData = await response.json();
            this.weeklySchedule = scheduleData;
            this.scheduleStart = new Date(scheduleData.m.start);

            console.log(`📅 Loaded weekly schedule for week ${weekNumber}`);
            console.log(`📅 Schedule period: ${this.scheduleStart.toISOString()}`);
        } catch (error) {
            console.log('⚠️ Could not load weekly schedule:', error.message);
            this.weeklySchedule = null;
            this.scheduleStart = null;
        }
    }

  
    /**
     * Get current scheduled video based on time
     */
    async getCurrentScheduledVideo() {
        if (!this.weeklySchedule || !this.scheduleStart) {
            return null;
        }

        try {
            const now = new Date();
            const gmt = new Date(now.toISOString());

            // Calculate elapsed time since schedule start
            const elapsed = gmt.getTime() - this.scheduleStart.getTime();
            const totalDays = Math.floor(elapsed / (24 * 60 * 60 * 1000));
            const dayOfWeek = totalDays % 7;
            const dayIndex = (this.options.scheduleStartDay + dayOfWeek) % 7;

            // Get current hour (0-23)
            const currentHour = gmt.getUTCHours();

            // Get day name from schedule
            const dayNames = this.weeklySchedule.m.days;
            const dayName = dayNames[dayIndex];

            // Find scheduled slots for this hour
            const slots = this.weeklySchedule.s.filter(slot =>
                slot.d === dayIndex && slot.h === currentHour
            );

            if (slots.length === 0) {
                console.log(`📅 No scheduled programming for ${dayName} ${currentHour}:00`);
                return null;
            }

            // Build scheduled clips array
            const scheduledClips = [];
            for (const slot of slots) {
                const video = this.weeklySchedule.v[slot.v];
                if (video) {
                    scheduledClips.push({
                        ...video,
                        slotIndex: scheduledClips.length,
                        slotDuration: 3600, // 1 hour slots
                        position: slot.p || 0,
                        day: dayName,
                        time: currentHour,
                        clipsInSlot: null // Will be populated later
                    });
                }
            }

            if (scheduledClips.length === 0) {
                return null;
            }

            // Calculate which clip should be playing now
            const minutesIntoHour = gmt.getUTCMinutes();
            const secondsIntoHour = minutesIntoHour * 60 + gmt.getUTCSeconds();

            let currentClip = null;
            let clipStartTime = 0;

            for (const clip of scheduledClips) {
                const clipDuration = clip.duration || 1800; // Default 30 minutes
                const clipEndTime = clipStartTime + clipDuration;

                if (secondsIntoHour >= clipStartTime && secondsIntoHour < clipEndTime) {
                    currentClip = {
                        ...clip,
                        position: secondsIntoHour - clipStartTime,
                        remainingDuration: clipEndTime - secondsIntoHour
                    };
                    break;
                }

                clipStartTime = clipEndTime;
            }

            if (!currentClip && scheduledClips.length > 0) {
                // Default to first clip if we're between clips
                currentClip = {
                    ...scheduledClips[0],
                    position: 0,
                    remainingDuration: scheduledClips[0].duration || 1800
                };
            }

            if (currentClip) {
                // Add clipsInSlot reference
                currentClip.clipsInSlot = scheduledClips;

                console.log(`📅 Found scheduled content: ${currentClip.show || currentClip.filename}`);
                console.log(`📅 Position: ${currentClip.position.toFixed(1)}s, Remaining: ${currentClip.remainingDuration.toFixed(1)}s`);

                return currentClip;
            }

            return null;
        } catch (error) {
            console.error('❌ Error getting scheduled video:', error);
            return null;
        }
    }

    /**
     * Calculate ad breaks for scheduled content
     */
    calculateAdBreaks(scheduledVideo, remainingTimeInSlot) {
        if (!this.options.enableClipAds || !scheduledVideo || !scheduledVideo.clipsInSlot) {
            return [];
        }

        const totalSlotDuration = scheduledVideo.slotDuration || 3600;
        const scheduledContentDuration = scheduledVideo.clipsInSlot.reduce((sum, clip) => sum + (clip.duration || 0), 0);
        const gapDuration = totalSlotDuration - scheduledContentDuration;

        if (gapDuration < this.options.minAdDuration) {
            return [];
        }

        // Calculate how many ads we can fit
        const adCount = Math.min(
            Math.floor(gapDuration / this.options.minAdDuration),
            this.options.maxAdsPerHour
        );

        const adBreaks = [];
        const positions = this.calculateAdPositions(scheduledVideo.clipsInSlot, adCount, gapDuration);

        for (let i = 0; i < positions.length; i++) {
            const adVideo = this.selectAdVideo(scheduledVideo.day, scheduledVideo.time, i);
            if (adVideo) {
                adBreaks.push({
                    position: positions[i],
                    video: adVideo,
                    duration: adVideo.duration || this.options.minAdDuration,
                    slotContext: `${scheduledVideo.day}_${scheduledVideo.time}`,
                    adIndex: i
                });
            }
        }

        return adBreaks;
    }

    /**
     * Calculate optimal ad positions
     */
    calculateAdPositions(clips, adCount, totalGapDuration) {
        const positions = [];

        if (clips.length === 0) {
            // No scheduled content, distribute ads evenly
            const interval = 3600 / (adCount + 1);
            for (let i = 0; i < adCount; i++) {
                positions.push(interval * (i + 1));
            }
            return positions;
        }

        // Place ads between scheduled clips
        let cumulativeTime = 0;
        const gapBetweenAds = totalGapDuration / (adCount + 1);

        for (let i = 0; i < clips.length && positions.length < adCount; i++) {
            cumulativeTime += clips[i].duration || 1800;

            if (i < clips.length - 1) {
                // Place ad after this clip
                const adPosition = cumulativeTime + gapBetweenAds;
                if (adPosition < 3600) {
                    positions.push(adPosition);
                }
            }
        }

        return positions.slice(0, adCount);
    }

    /**
     * Select an ad video from saved videos
     */
    selectAdVideo(day, time, adIndex) {
        if (!this.savedVideos || Object.keys(this.savedVideos).length === 0) {
            return null;
        }

        const videoList = Object.values(this.savedVideos);
        const seed = `${day}_${time}_${adIndex}`;
        const hash = this.simpleHash(seed);

        // Select video based on hash
        const selectedIndex = hash % videoList.length;
        const selectedVideo = videoList[selectedIndex];

        return {
            ...selectedVideo,
            isAd: true,
            adContext: { day, time, index: adIndex }
        };
    }

    /**
     * Simple hash function for consistent ad selection
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Get next video to play with fallback hierarchy
     */
    async getNextVideo() {
        // Priority 1: Scheduled content
        if (this.options.enableScheduledOverride) {
            const scheduledVideo = await this.getCurrentScheduledVideo();
            if (scheduledVideo && scheduledVideo.filename) {
                console.log('📅 Playing scheduled content with priority');
                return {
                    ...scheduledVideo,
                    source: 'scheduled',
                    adBreaks: this.calculateAdBreaks(scheduledVideo, scheduledVideo.remainingDuration)
                };
            }
        }

        // Priority 2: Saved videos with ad dispersion
        if (this.options.fallbackToSavedVideos && this.savedVideos && Object.keys(this.savedVideos).length > 0) {
            const videoList = Object.values(this.savedVideos);
            const randomIndex = Math.floor(Math.random() * videoList.length);
            const selectedVideo = videoList[randomIndex];

            console.log('📼 Playing saved video as fallback');
            return {
                ...selectedVideo,
                source: 'saved_videos',
                adBreaks: this.options.enableClipAds ? this.generateRandomAdBreaks() : []
            };
        }

        // Priority 3: Static schedule
        if (this.options.fallbackToStatic && this.staticVideos) {
            console.log('📺 Playing static schedule as fallback');
            return {
                ...this.staticVideos,
                source: 'static'
            };
        }

        // Final fallback: error state
        console.error('❌ No content available for playback');
        return {
            filename: 'error.mp4',
            title: 'Content Unavailable',
            description: 'No content available for playback',
            source: 'error'
        };
    }

    /**
     * Generate random ad breaks for saved video content
     */
    generateRandomAdBreaks() {
        if (!this.options.enableClipAds || !this.savedVideos) {
            return [];
        }

        const adCount = Math.floor(Math.random() * 3) + 1; // 1-3 ads
        const adBreaks = [];

        for (let i = 0; i < adCount; i++) {
            const position = 300 + (i * 600); // Every 10 minutes
            const adVideo = this.selectAdVideo('fallback', 'any', i);

            if (adVideo) {
                adBreaks.push({
                    position,
                    video: adVideo,
                    duration: adVideo.duration || this.options.minAdDuration,
                    slotContext: 'fallback',
                    adIndex: i
                });
            }
        }

        return adBreaks;
    }

    /**
     * Get week number for date
     */
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            hasWeeklySchedule: !!this.weeklySchedule,
            hasSavedVideos: !!(this.savedVideos && Object.keys(this.savedVideos).length > 0),
            hasStaticSchedule: !!this.staticVideos,
            isScheduledVideoPlaying: this.isScheduledVideoPlaying,
            isBufferingScheduledVideo: this.isBufferingScheduledVideo,
            options: this.options
        };
    }
}

export default VideoScheduler;