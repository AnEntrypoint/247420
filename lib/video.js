import Scheduler from './scheduler.js';
import { WEEKS } from './week-schedules.js';
import catalog from '../schedule.json' with { type: 'json' };
import { buildPool, buildWeek, WEEK_SECONDS } from './station.js';

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

  slotKey(slot) {
    return slot ? this.scheduler.state.currentWeek + ':' + slot.entry.t + ':' + slot.entry.v : 'static';
  }

  async syncSlot() {
    if (!this.videoElement) return;
    if (this.scheduler.getWeekIndex() !== this.loadedWeek) await this.loadSchedule();
    if (this.slotKey(this.scheduler.getCurrentSlot()) !== this.playingKey) this.playCurrentSlot();
  }

  playCurrentSlot() {
    const slot = this.scheduler.getCurrentSlot();
    this.playingKey = this.slotKey(slot);
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
    const seekTo = entry.kind === 'ad' ? (slot.elapsed || 0) : (slot.seek || 0);
    const label = entry.kind === 'ad' ? `Commercial break` : `Now playing - ${title}`;

    this.videoElement.src = url;
    this.videoElement.currentTime = seekTo;
    this.videoElement.loop = false;
    const key = this.playingKey;
    this.videoElement.play().catch(() => { if (this.playingKey === key) this.playStatic(title); });
    this.state.isPlaying = true;
    this.state.currentSlot = slot;
    if (statusEl) statusEl.textContent = label;
  }

  playStatic(label = 'Off Air') {
    if (!this.videoElement) return;
    this.state.currentSlot = null;
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

  async loadSchedule(now = new Date()) {
    if (!Array.isArray(WEEKS) || !WEEKS.length) throw new Error('week schedule module is empty');
    this.scheduler.setWeekCount(WEEKS.length);
    if (!this.pool) this.pool = buildPool(WEEKS, catalog, (await import('./pool.json', { with: { type: 'json' } })).default);
    const weekIndex = this.scheduler.getWeekIndex(now);
    this.scheduler.getCurrentWeek(now);
    const week = buildWeek(this.pool, weekIndex);
    const opening = buildWeek(this.pool, weekIndex + 1, { nextShow: null, blocks: 1 })[0];
    week.push({ ...opening, t: WEEK_SECONDS, end: WEEK_SECONDS + opening.end - opening.t });
    this.scheduler.setSchedule(week);
    this.loadedWeek = weekIndex;
    this.scheduler.getCurrentDay(now);
    return this.scheduler.schedule;
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
