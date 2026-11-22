import { renderGuide, markNow, jumpToNow, weekSecondNow } from './guide-grid.js';

function countdownText(seconds) {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function syncGuide(player) {
  const el = document.getElementById('schedule');
  if (!el || !player.scheduler.schedule.length) return;
  if (el.dataset.week !== String(player.loadedWeek) && !el.closest('.hidden')) renderGuide(el, player.scheduler.schedule, player.loadedWeek);
  markNow(el);
}

function syncAudio(player) {
  const mute = document.getElementById('tv-mute');
  const music = document.getElementById('tv-music');
  if (mute && player.videoElement) {
    mute.textContent = player.videoElement.muted ? 'unmute' : 'mute';
    mute.setAttribute('aria-pressed', player.videoElement.muted ? 'true' : 'false');
  }
  if (music && window.__music) {
    music.textContent = window.__music.enabled ? 'music: on' : 'music: off';
    music.setAttribute('aria-pressed', window.__music.enabled ? 'true' : 'false');
  }
}

function updateCountdown(player) {
  const el = document.getElementById('tv-countdown');
  if (!el || !player.scheduler.schedule.length) return;
  const next = player.scheduler.getUpcomingSlots(1)[0];
  if (next) el.textContent = 'in ' + countdownText(Math.max(0, next.time - weekSecondNow()));
  syncGuide(player);
  syncAudio(player);
}

function toggleTheatre() {
  const on = document.body.classList.toggle('tv-theatre');
  const button = document.getElementById('tv-theatre');
  if (button) button.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function toggleMute(player) {
  player.videoElement.muted = !player.videoElement.muted;
  syncAudio(player);
}

function nudgeVolume(player, delta) {
  const level = Math.min(1, Math.max(0, Math.round((player.state.volume + delta) * 20) / 20));
  player.setVolume(level);
  const slider = document.getElementById('tv-volume');
  if (slider) slider.value = String(level);
}

function onKey(player, event) {
  if (!document.getElementById('tv-player') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^(input|textarea|select)$/i.test(event.target.tagName) || event.target.closest('.guide')) return;
  const actions = {
    f: () => window.__tvFullscreenToggle(),
    g: () => window.__tvGuideToggle(),
    t: toggleTheatre,
    m: () => toggleMute(player),
    ArrowUp: () => nudgeVolume(player, 0.05),
    ArrowDown: () => nudgeVolume(player, -0.05),
  };
  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

export function installTvUi(player) {
  window.__tvTheatreToggle = toggleTheatre;
  window.__tvMuteToggle = () => toggleMute(player);
  window.__tvMusicToggle = () => document.getElementById('music-toggle').click();
  window.__tvGuideNow = () => jumpToNow(document.querySelector('#schedule .guide'));
  document.addEventListener('keydown', event => onKey(player, event));
  setInterval(() => updateCountdown(player), 1000);
}
