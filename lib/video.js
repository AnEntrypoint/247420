// Video player with schedule support

import Scheduler from './scheduler.js';

class VideoPlayer {
  constructor() {
    this.scheduler = new Scheduler();
    this.state = {
      currentIndex: -1,
      isPlaying: false,
      volume: 0.8,
      currentTime: 0,
      duration: 0,
    };
    this.videoElement = null;
    this.container = null;
    window.__debug.video = this.state;
  }

  async init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.createPlayerDOM();
    await this.loadSchedule();
    this.state.isReady = true;
    this.playCurrentSlot();
  }

  playCurrentSlot() {
    const slot = this.scheduler.getCurrentSlot();
    const statusEl = document.getElementById('tv-status');

    if (!slot) {
      this.playStatic('Off Air');
      return;
    }

    const entry = slot.entry;
    const url = entry.url;
    const title = entry.title || entry.v;

    if (!url || entry.v === 'static') {
      this.playStatic(title);
      return;
    }

    // Ads play from their own start (full clip); segments and movies resume at
    // the show's running offset (seek) so ad breaks do not restart the show.
    const seekTo = entry.kind === 'ad' ? (slot.elapsed || 0) : (slot.seek || 0);
    const label = entry.kind === 'ad' ? `Commercial break` : `Now playing - ${title}`;

    this.videoElement.src = url;
    this.videoElement.currentTime = seekTo;
    this.videoElement.loop = false;
    this.videoElement.play().catch(() => this.playStatic(title));
    this.state.isPlaying = true;
    this.state.currentSlot = slot;
    if (statusEl) statusEl.textContent = label;
  }

  playStatic(label = 'Off Air') {
    if (!this.videoElement) return;
    this.videoElement.src = '/static.mp4';
    this.videoElement.loop = true;
    this.videoElement.play().catch(() => {});
    this.state.isPlaying = true;
    const statusEl = document.getElementById('tv-status');
    if (statusEl) statusEl.textContent = label;
  }

  createPlayerDOM() {
    this.container.innerHTML = '<video id="video-player" class="tv-video" autoplay muted playsinline></video>';
    this.videoElement = document.getElementById('video-player');
    this.videoElement.volume = this.state.volume;
  }

  async loadSchedule() {
    try {
      const res = await fetch('/schedule.json');
      if (res.ok) this.scheduler.setSchedule(await res.json());
    } catch (e) {
      console.error('Failed to load schedule:', e);
    }
  }

  async playVideo(url) {
    if (!this.videoElement) return;
    this.videoElement.src = url;
    await this.videoElement.play();
    this.state.isPlaying = true;
  }

  pause() {
    if (this.videoElement) { this.videoElement.pause(); this.state.isPlaying = false; }
  }

  setVolume(level) {
    if (this.videoElement) { this.videoElement.volume = level; this.state.volume = level; }
  }

  getCurrentSlotContent() {
    return this.scheduler.getCurrentSlot();
  }
}

export default VideoPlayer;
