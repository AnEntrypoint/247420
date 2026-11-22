import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { WEEKS } = await import(pathToFileURL(path.join(root, 'lib/week-schedules.js')).href);
const station = await import(pathToFileURL(path.join(root, 'lib/station.js')).href);
const { buildPool, buildWeek, rotationWeeks, classify, BLOCK_SECONDS, WEEK_SECONDS, WEEK_EPOCH, MOVIE_TIMES } = station;

global.window = { __debug: {} };
const { default: Scheduler } = await import(pathToFileURL(path.join(root, 'lib/scheduler.js')).href);
const scheduler = new Scheduler();
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'schedule.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(root, 'lib/pool.json'), 'utf8'));
const unlicensedOnAir = extra.items.filter(item => !item.rights);
if (unlicensedOnAir.length) throw new Error(unlicensedOnAir.length + ' pool items have no rights record, e.g. ' + unlicensedOnAir[0].url);
const pool = buildPool(WEEKS, catalog, extra);
const byRights = {};
for (const item of extra.items) { const key = item.rights.split(':')[0] === 'cc' ? 'creative-commons' : item.rights.split(':')[0]; byRights[key] = (byRights[key] || 0) + 1; }
const currentWeek = Math.floor((Date.now() - WEEK_EPOCH) / (WEEK_SECONDS * 1000));
const sample = [...new Set([0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 181, 182, 183, 184, 365, 366, currentWeek, currentWeek + 1])];
if (scheduler.getWeekIndex() !== currentWeek) throw new Error('scheduler week index ' + scheduler.getWeekIndex() + ' disagrees with station epoch week ' + currentWeek);
if (sample.length < 20) throw new Error('need 20 distinct sample weeks, got ' + sample.length);

const failures = [];
const expect = (ok, message) => { if (!ok && failures.length < 20) failures.push(message); };
const seriesNames = new Set(pool.series.map(s => s.name));
const movieStarts = new Set();
const seriesStarts = new Map();
const share = new Map();
let lastWeek = null;

for (const weekIndex of sample) {
  const items = buildWeek(pool, weekIndex);
  const cover = new Uint8Array(WEEK_SECONDS);
  const programsThisWeek = new Map();
  items.forEach((item, i) => {
    expect(item.end > item.t, 'week ' + weekIndex + ' empty item at ' + item.t);
    for (let s = item.t; s < item.end; s++) cover[s]++;
    const length = item.end - item.t;
    expect(item.seek >= 0 && item.seek + length <= item.seek + item.d, 'week ' + weekIndex + ' seek outside video at ' + item.t);
    expect(length <= item.d, 'week ' + weekIndex + ' item longer than its video at ' + item.t);
    if (length < item.d) expect(item.end % BLOCK_SECONDS === 0, 'week ' + weekIndex + ' clip cut short mid-block at ' + item.t);
    if (i) expect(items[i - 1].title !== item.title, 'week ' + weekIndex + ' ' + item.title + ' twice in a row at ' + item.t);
    if (item.kind === 'show' || item.kind === 'movie') {
      expect(item.t % BLOCK_SECONDS === 0, 'week ' + weekIndex + ' ' + item.title + ' starts off the half hour at ' + item.t);
      expect(length === item.d, 'week ' + weekIndex + ' program cut short: ' + item.title);
      if (item.kind === 'movie') movieStarts.add(item.t % 86400);
      else {
        programsThisWeek.set(item.title, (programsThisWeek.get(item.title) || 0) + 1);
        if (!seriesStarts.has(item.title)) seriesStarts.set(item.title, new Set());
        seriesStarts.get(item.title).add(item.t);
      }
    }
    share.set(item.title, (share.get(item.title) || 0) + length);
  });
  let gaps = 0;
  let doubled = 0;
  for (let s = 0; s < WEEK_SECONDS; s++) { if (cover[s] === 0) gaps++; if (cover[s] > 1) doubled++; }
  expect(gaps === 0 && doubled === 0, 'week ' + weekIndex + ' has ' + gaps + ' uncovered and ' + doubled + ' doubled seconds');
  for (const name of seriesNames) expect(programsThisWeek.get(name) === 1, 'week ' + weekIndex + ' airs ' + name + ' ' + (programsThisWeek.get(name) || 0) + ' times');
  expect(items[items.length - 1].end === WEEK_SECONDS, 'week ' + weekIndex + ' does not end at the week boundary');
  if (lastWeek && lastWeek.index + 1 === weekIndex) expect(lastWeek.last.title !== items[0].title, 'week boundary ' + lastWeek.index + '/' + weekIndex + ' repeats ' + items[0].title);
  lastWeek = { index: weekIndex, last: items[items.length - 1] };
}

for (const [name, starts] of seriesStarts) expect(starts.size === 1, name + ' airs at ' + starts.size + ' different weekly times');
const allowedMovieTimes = new Set(MOVIE_TIMES.map(t => Number(t.slice(0, 2)) * 3600 + Number(t.slice(3)) * 60));
for (const start of movieStarts) expect(allowedMovieTimes.has(start), 'movie starts at an unplanned time of day: ' + start);

const total = [...share.values()].reduce((a, b) => a + b, 0);
const ranked = [...share].sort((a, b) => b[1] - a[1]);
console.log('pool classes', JSON.stringify(pool.counts), 'series', pool.series.length, 'movies', pool.movies.length, 'clips', pool.clips.length, 'ads', pool.ads.length);
console.log('pool checked', extra.checked, 'dead', extra.dead.length, 'rights', JSON.stringify(byRights), 'unslotted series', pool.unslotted.length);
const clipHours = pool.clips.reduce((sum, c) => sum + c.dur, 0) / 3600;
console.log('unique clip hours ' + clipHours.toFixed(0) + ', series episodes ' + pool.series.reduce((n, s) => n + s.episodes.length, 0) + ', longest series cycle ' + Math.max(...pool.series.map(s => s.episodes.length)) + ' weeks');
console.log('rotation before the weekly line-up repeats: ' + rotationWeeks(pool) + ' weeks');
console.log('weeks checked', sample.join(','));
console.log('air time covered', (total / 3600).toFixed(0) + 'h of ' + (sample.length * 168) + 'h');
for (const [title, seconds] of ranked.slice(0, 12)) console.log((100 * seconds / total).toFixed(2).padStart(6) + '%  ' + title);
const nml = share.get('Norm Macdonald Live') || 0;
console.log('Norm Macdonald Live share ' + (100 * nml / total).toFixed(2) + '%; shows on air ' + share.size);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('COVERAGE_OK');
