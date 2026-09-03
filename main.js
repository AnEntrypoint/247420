// Main application entry — single SPA rendered via the anentrypoint-design
// SDK (window.ds.applyDiff). Page components live in lib/components.js.

// jsDelivr, not raw.githack — see index.html for why (githack outage 2026-08-17).
// SHA-pinned, not @main — see index.html for why (12h floating-tag staleness).
import { Router } from 'https://cdn.jsdelivr.net/gh/AnEntrypoint/design@4349f3af01f163d846b7464b936e4538691c1be9/dist/247420.js';
import { pages } from './lib/components.js';
import { loadShowcase } from './lib/projects.js';
import { loadBlogPosts } from './lib/community.js';
import VideoPlayer from './lib/video.js';
import Music from './lib/music.js';

const router = new Router({ fallback: pages.home });
window.__router = router;

window.__music = new Music();

// Standalone toggle outside the SDK's #app mount (see index.html) — one
// global control that never re-renders with the route, instead of a
// per-page footer widget.
const musicToggleEl = document.getElementById('music-toggle');
function syncMusicToggle() {
    if (!musicToggleEl) return;
    musicToggleEl.setAttribute('aria-pressed', window.__music.enabled ? 'true' : 'false');
    musicToggleEl.title = window.__music.enabled ? 'mute background music' : 'play background music';
    musicToggleEl.textContent = window.__music.enabled ? 'music: on' : 'music: off';
    musicToggleEl.classList.toggle('on', window.__music.enabled);
}
if (musicToggleEl) {
    musicToggleEl.addEventListener('click', () => { window.__music.toggle(); syncMusicToggle(); });
    syncMusicToggle();
}

Object.entries(pages).forEach(([name, component]) => router.register(name, component));

loadShowcase().then(() => router.render && router.render());
loadBlogPosts().then(() => router.render && router.render());
window.__debug.showcase = () => loadShowcase();
window.__debug.blogPosts = () => loadBlogPosts();

const player = new VideoPlayer();
window.__debug.videoPlayer = player;
window.__debug.video = player.state;
window.__debug.scheduler = player.scheduler.state;

// entry.t is seconds-since-UTC-day-start; render it as a wall-clock HH:MM (UTC)
// so the guide reads like a TV listing instead of a raw offset.
function slotClock(t) {
    const hh = Math.floor(t / 3600) % 24;
    const mm = Math.floor((t % 3600) / 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function renderSchedule() {
    const el = document.getElementById('schedule');
    if (!el) return;
    const sched = player.scheduler.schedule;
    if (!sched || !sched.length) {
        el.innerHTML = '<p class="ds-prose">No schedule data.</p>';
        return;
    }
    el.innerHTML = sched.map(entry => `
        <div class="schedule-slot">
            <span class="time">${slotClock(entry.t)}</span>
            <span class="title">${entry.title || entry.v}</span>
        </div>
    `).join('');
}

// Now-playing + up-next, rendered onto the always-visible TV strip (not the
// hidden guide). Deterministic from scheduler state — no setTimeout race.
function renderNowNext() {
    const nowEl = document.getElementById('tv-now');
    const nextEl = document.getElementById('tv-next');
    if (!nowEl && !nextEl) return;
    const sched = player.scheduler.schedule;
    if (!sched || !sched.length) {
        if (nowEl) nowEl.textContent = 'off air — no schedule loaded';
        if (nextEl) nextEl.textContent = '—';
        return;
    }
    const slot = player.scheduler.getCurrentSlot();
    if (nowEl) {
        nowEl.textContent = slot
            ? (slot.entry.title || slot.entry.v || 'untitled')
            : 'off air — static';
    }
    const upcoming = player.scheduler.getUpcomingSlots(1);
    if (nextEl) {
        if (upcoming.length) {
            const u = upcoming[0];
            const secs = player.scheduler.secondsSinceUtcDayStart(new Date());
            const mins = Math.max(0, Math.round((u.time - secs) / 60));
            const when = mins <= 0 ? 'any second' : (mins === 1 ? 'in 1 min' : `in ${mins} min`);
            nextEl.textContent = `${u.entry.title || u.entry.v} — ${when}`;
        } else {
            nextEl.textContent = 'wraps to the top of the schedule';
        }
    }
}

function renderTv() {
    renderSchedule();
    renderNowNext();
}

window.__tvGuideToggle = () => {
    const overlay = document.getElementById('tv-guide-overlay');
    if (!overlay) return;
    const hidden = overlay.classList.contains('hidden');
    overlay.classList.toggle('hidden', !hidden);
    if (hidden) renderSchedule();
};

// While the TV page is open, keep now/next honest against the broadcast clock.
// Cleared whenever we leave the route (no #tv-now in the DOM).
let tvTick = null;
function startTvTick() {
    if (tvTick) return;
    tvTick = setInterval(() => {
        if (!document.getElementById('tv-now')) { clearInterval(tvTick); tvTick = null; return; }
        renderNowNext();
    }, 15000);
}

function handleRouteChange() {
    const tvPlayerEl = document.getElementById('tv-player');
    window.__music.setTvActive(!!tvPlayerEl);
    if (tvPlayerEl && !player.videoElement) {
        player.container = null;
        player.init('tv-player').then(() => renderTv()).catch(e => console.error('TV init error:', e));
    } else if (!tvPlayerEl && !player.scheduler.schedule.length) {
        player.loadSchedule().catch(e => console.error('Schedule load error:', e));
    }
    player.scheduler.getUpcomingSlots();
    if (tvPlayerEl) { startTvTick(); }
    // Render once the schedule is present; if it is still loading, render after.
    if (player.scheduler.schedule.length) renderTv();
    else player.loadSchedule().then(() => renderTv()).catch(() => {});
}

function syncFromHash() {
    router.render();
    handleRouteChange();
}

async function waitForSdk(timeoutMs = 5000) {
    const start = Date.now();
    while (!window.ds || !window.ds.applyDiff) {
        if (Date.now() - start > timeoutMs) throw new Error('SDK failed to load');
        await new Promise(r => setTimeout(r, 16));
    }
}

async function init() {
    await waitForSdk();
    router.start();
    handleRouteChange();
    window.addEventListener('hashchange', () => setTimeout(syncFromHash, 0));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
