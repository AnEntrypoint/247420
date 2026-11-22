import { BLOCK_SECONDS, DAY_SECONDS, WEEK_SECONDS, DAY_NAMES } from './station.js';

const BLOCKS_PER_DAY = DAY_SECONDS / BLOCK_SECONDS;
const BLOCKS_PER_WEEK = WEEK_SECONDS / BLOCK_SECONDS;
const SERIES_HUES = 9;
const SHORT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function weekSecondNow(now = new Date()) {
  return ((now.getUTCDay() + 6) % 7) * DAY_SECONDS + now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function hueOf(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return h % SERIES_HUES;
}

function clockOf(block) {
  const minutes = (block % BLOCKS_PER_DAY) * 30;
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
}

function buildCells(schedule) {
  const entries = schedule.filter(entry => entry.t < WEEK_SECONDS);
  const programs = new Map();
  for (const entry of entries) if ((entry.kind === 'show' || entry.kind === 'movie') && entry.t % BLOCK_SECONDS === 0) programs.set(entry.t / BLOCK_SECONDS, entry);
  const cells = [];
  for (let block = 0; block < BLOCKS_PER_WEEK;) {
    const program = programs.get(block);
    if (program) {
      const span = Math.ceil((program.end - program.t) / BLOCK_SECONDS);
      cells.push({ block, span, kind: program.kind, title: program.title, detail: program.episode || '', hue: hueOf(program.title) });
      block += span;
      continue;
    }
    const from = block * BLOCK_SECONDS;
    const clips = entries.filter(entry => entry.t < from + BLOCK_SECONDS && entry.end > from).map(entry => ({
      title: entry.title, seconds: Math.min(entry.end, from + BLOCK_SECONDS) - Math.max(entry.t, from),
    }));
    cells.push({ block, span: 1, kind: 'reel', title: 'clip reel', detail: [...new Set(clips.map(c => c.title))].join(', '), clips });
    block++;
  }
  return cells;
}

function cellHtml(cell) {
  const label = clockOf(cell.block) + ' ' + cell.title + (cell.detail ? ' — ' + cell.detail : '');
  const style = '--span:' + cell.span + (cell.hue === undefined ? '' : ';--hue:' + cell.hue);
  const inner = cell.kind === 'reel'
    ? '<span class="guide-clock">' + clockOf(cell.block) + '</span><span class="guide-strip">' + cell.clips.map((c, i) => '<i style="flex-grow:' + c.seconds + '" class="seg' + (i % 2) + '"></i>').join('') + '</span><span class="guide-name">reel: ' + escapeHtml(cell.clips[0].title) + '</span>'
    : '<span class="guide-clock">' + clockOf(cell.block) + '</span><span class="guide-name">' + escapeHtml(cell.title) + '</span>';
  return '<button type="button" class="guide-cell kind-' + cell.kind + '" tabindex="-1" style="' + style + '" data-b="' + cell.block + '" data-span="' + cell.span + '" aria-label="' + escapeHtml(label) + '" title="' + escapeHtml(label) + '">' + inner + '</button>';
}

function legendHtml(cells) {
  const shows = new Map();
  for (const cell of cells) if (cell.kind === 'show') shows.set(cell.title, cell.hue);
  const chips = [...shows].sort(([a], [b]) => (a < b ? -1 : 1)).map(([title, hue]) => '<li class="legend-chip" style="--hue:' + hue + '"><span class="swatch kind-show"></span>' + escapeHtml(title) + '</li>').join('');
  return '<details class="guide-legend"><summary>legend</summary><ul>'
    + '<li class="legend-chip"><span class="swatch kind-movie"></span>movie</li>'
    + '<li class="legend-chip"><span class="swatch kind-reel"></span>clip reel — the clips in that half hour, sized by length</li>'
    + chips + '</ul></details>';
}

export function renderGuide(el, schedule, weekIndex) {
  const cells = buildCells(schedule);
  const rows = DAY_NAMES.map((name, day) => '<div class="guide-row" role="row" data-day="' + day + '"><span class="guide-dayname" role="rowheader">' + SHORT_DAYS[day] + '</span><div class="guide-cells">'
    + cells.filter(c => Math.floor(c.block / BLOCKS_PER_DAY) === day).map(cellHtml).join('') + '</div></div>').join('');
  const hours = Array.from({ length: 24 }, (_, h) => '<span>' + String(h).padStart(2, '0') + ':00</span>').join('');
  const tabs = SHORT_DAYS.map((name, day) => '<button type="button" class="btn guide-day" data-day="' + day + '" aria-pressed="false">' + name + '</button>').join('');
  el.dataset.week = String(weekIndex);
  el.innerHTML = '<div class="guide" role="grid" aria-label="this week, UTC, 30-minute blocks" data-day="0">'
    + '<div class="guide-tools"><div class="guide-days" role="group" aria-label="day">' + tabs + '</div><button type="button" class="btn guide-now">jump to now</button></div>'
    + '<div class="guide-scroll"><div class="guide-hours" aria-hidden="true">' + hours + '</div>' + rows + '</div>' + legendHtml(cells) + '</div>';
  wireGuide(el.querySelector('.guide'));
  markNow(el);
  selectDay(el.querySelector('.guide'), Math.floor(weekSecondNow() / DAY_SECONDS));
}

function selectDay(guide, day) {
  guide.dataset.day = String(day);
  guide.querySelectorAll('.guide-day').forEach(b => b.setAttribute('aria-pressed', b.dataset.day === String(day) ? 'true' : 'false'));
}

function focusCell(guide, cell) {
  guide.querySelectorAll('.guide-cell[tabindex="0"]').forEach(c => c.setAttribute('tabindex', '-1'));
  cell.setAttribute('tabindex', '0');
  cell.focus();
}

function cellAt(row, block) {
  return [...row.querySelectorAll('.guide-cell')].find(c => Number(c.dataset.b) <= block && block < Number(c.dataset.b) + Number(c.dataset.span));
}

function onKey(guide, event) {
  const cell = event.target.closest('.guide-cell');
  if (!cell) return;
  const row = cell.closest('.guide-row');
  const cellsInRow = [...row.querySelectorAll('.guide-cell')];
  const index = cellsInRow.indexOf(cell);
  const dayIndex = Number(row.dataset.day);
  const block = Number(cell.dataset.b);
  let target = null;
  if (event.key === 'ArrowRight') target = cellsInRow[index + 1];
  else if (event.key === 'ArrowLeft') target = cellsInRow[index - 1];
  else if (event.key === 'Home') target = cellsInRow[0];
  else if (event.key === 'End') target = cellsInRow[cellsInRow.length - 1];
  else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const nextDay = dayIndex + (event.key === 'ArrowDown' ? 1 : -1);
    const nextRow = guide.querySelector('.guide-row[data-day="' + nextDay + '"]');
    if (nextRow) { selectDay(guide, nextDay); target = cellAt(nextRow, block + (nextDay - dayIndex) * BLOCKS_PER_DAY); }
  }
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  focusCell(guide, target);
}

function wireGuide(guide) {
  guide.addEventListener('keydown', event => onKey(guide, event));
  guide.addEventListener('focusin', event => {
    const cell = event.target.closest('.guide-cell');
    if (cell && cell.getAttribute('tabindex') !== '0') focusCell(guide, cell);
  });
  guide.querySelectorAll('.guide-day').forEach(b => b.addEventListener('click', () => selectDay(guide, Number(b.dataset.day))));
  guide.querySelector('.guide-now').addEventListener('click', () => jumpToNow(guide));
  const first = guide.querySelector('.guide-cell');
  if (first) first.setAttribute('tabindex', '0');
}

export function jumpToNow(guide) {
  const second = weekSecondNow();
  const day = Math.floor(second / DAY_SECONDS);
  selectDay(guide, day);
  const cell = guide.querySelector('.guide-cell[aria-current="time"]');
  if (!cell) throw new Error('no guide cell covers week second ' + second);
  cell.scrollIntoView({ inline: 'center', block: 'nearest' });
  focusCell(guide, cell);
}

export function markNow(el) {
  const guide = el && el.querySelector('.guide');
  if (!guide) return;
  const block = Math.floor(weekSecondNow() / BLOCK_SECONDS);
  const current = guide.querySelector('.guide-cell[aria-current="time"]');
  if (current && Number(current.dataset.b) <= block && block < Number(current.dataset.b) + Number(current.dataset.span)) return;
  if (current) current.removeAttribute('aria-current');
  const row = guide.querySelector('.guide-row[data-day="' + Math.floor(block / BLOCKS_PER_DAY) + '"]');
  const next = row && cellAt(row, block);
  if (next) next.setAttribute('aria-current', 'time');
}
