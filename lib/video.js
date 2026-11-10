import Scheduler from './scheduler.js';
import { WEEKS } from './week-schedules.js';

function parseClock(text) {
  const m = /^(\d{1,2}):(\d{2})\s+(AM|PM)$/i.exec(String(text || '').trim());
  if (!m) throw new Error('unparseable week slot clock: ' + JSON.stringify(text));
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  return hour * 3600 + Number(m[2]) * 60;
}

function flattenWeek(week, weekNumber) {
  const days = Array.isArray(week.days) ? week.days : null;
  if (!days || days.length !== 7) throw new Error('week ' + weekNumber + ' has no 7-day metadata');
  if (!week.v || typeof week.v !== 'object') throw new Error('week ' + weekNumber + ' has no video catalog');
  if (!Array.isArray(week.s) || !week.s.length) throw new Error('week ' + weekNumber + ' has no slots');
  const slots = week.s.map((slot, index) => {
    const [day, clock, videoId, duration] = slot;
    const dayIndex = days.indexOf(day);
    if (dayIndex < 0) throw new Error('week ' + weekNumber + ' slot ' + index + ' has unknown day ' + JSON.stringify(day));
    const video = week.v[videoId];
    if (!Array.isArray(video) || !video[2]) throw new Error('week ' + weekNumber + ' slot ' + index + ' references missing video ' + JSON.stringify(videoId));
    const t = dayIndex * 86400 + parseClock(clock);
    return {
      t,
      end: t + Number(duration || 3600),
      v: videoId,
      d: Number(duration || 3600),
      title: video[0] || video[1] || videoId,
      episode: video[1] || '',
      url: video[2],
      kind: 'show',
      seek: 0,
      week: weekNumber,
      day,
    };
  }).sort((a, b) => a.t - b.t);
  for (let i = 1; i < slots.length; i++) {
    slots[i - 1].end = Math.min(slots[i - 1].end, slots[i].t);
  }
  slots[slots.length - 1].end = Math.min(slots[slots.length - 1].end, 7 * 86400);
  return slots;
}

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

  async loadSchedule(now = new Date()) {
    if (!Array.isArray(WEEKS) || !WEEKS.length) throw new Error('week schedule module is empty');
    this.scheduler.setWeekCount(WEEKS.length);
    const weekNumber = this.scheduler.getCurrentWeek(now);
    const week = WEEKS[weekNumber - 1];
    if (!week || week.week !== weekNumber) throw new Error('missing week ' + weekNumber + ' in module of ' + WEEKS.length + ' weeks');
    const epoch = Date.parse(week.start);
    if (!Number.isFinite(epoch)) throw new Error('week ' + weekNumber + ' has invalid start: ' + JSON.stringify(week.start));
    if (epoch !== this.scheduler.weekStart.getTime()) {
      throw new Error('week ' + weekNumber + ' start ' + week.start + ' does not match scheduler epoch ' + this.scheduler.weekStart.toISOString());
    }
    this.scheduler.setSchedule(flattenWeek(week, weekNumber));
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
