function secondsIntoWeek(now) {
  return ((now.getUTCDay() + 6) % 7) * 86400 + now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
}

function countdownText(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes + ':' + String(seconds % 60).padStart(2, '0');
}

function updateCountdown(player) {
  const el = document.getElementById('tv-countdown');
  if (!el || !player.scheduler.schedule.length) return;
  const next = player.scheduler.getUpcomingSlots(1)[0];
  if (!next) return;
  const remaining = Math.max(0, next.time - secondsIntoWeek(new Date()));
  el.textContent = 'in ' + countdownText(remaining);
  const guideNow = document.querySelector('.schedule-slot.now');
  const rows = [...document.querySelectorAll('.schedule-slot')];
  const current = rows.filter(row => Number(row.dataset.t) <= secondsIntoWeek(new Date())).pop();
  if (current && current !== guideNow) {
    if (guideNow) guideNow.classList.remove('now');
    current.classList.add('now');
  }
}

function toggleTheatre() {
  const on = document.body.classList.toggle('tv-theatre');
  const button = document.getElementById('tv-theatre');
  if (button) button.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function nudgeVolume(player, delta) {
  const level = Math.min(1, Math.max(0, Math.round((player.state.volume + delta) * 20) / 20));
  player.setVolume(level);
  const slider = document.getElementById('tv-volume');
  if (slider) slider.value = String(level);
}

function onKey(player, event) {
  if (!document.getElementById('tv-player') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^(input|textarea|select)$/i.test(event.target.tagName)) return;
  const actions = {
    f: () => window.__tvFullscreenToggle(),
    g: () => window.__tvGuideToggle(),
    t: toggleTheatre,
    m: () => { player.videoElement.muted = !player.videoElement.muted; },
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
  document.addEventListener('keydown', event => onKey(player, event));
  setInterval(() => updateCountdown(player), 1000);
}
