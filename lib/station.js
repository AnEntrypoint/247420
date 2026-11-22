export const WEEK_EPOCH = Date.parse('2025-10-13T00:00:00Z');
export const BLOCK_SECONDS = 1800;
export const DAY_SECONDS = 86400;
export const WEEK_SECONDS = 7 * DAY_SECONDS;
export const AD_MAX = 60;
export const MONTAGE_MAX = 1200;
export const EPISODE_MAX = 3660;
export const INTERLEAVE_SEASONS = true;
export const MOVIE_TIMES = ['14:00', '22:00'];
export const MOVIE_MAX = 7200;
export const UNPLAYABLE_URLS = [
  'https://archive.org/download/blood-cult-1985/Madman%20(1982)%20.mp4',
  'https://archive.org/download/blood-cult-1985/Squirm%20(1976).mp4',
  'https://archive.org/download/CountDuckula_201706/CountDuckulaS01e37.mp4',
  'https://archive.org/download/CountDuckula_201706/CountDuckulaS01e63.mp4',
  'https://archive.org/download/youtube-ccwsEDor1QM/La_Linea_120-ccwsEDor1QM.mp4',
];
export const SERIES_TIERS = ['19:00', '16:30', '12:00', '10:00', '08:00', '06:00', '04:00', '02:00', '00:30'];
export const SERIES_FIRST_DAY = 3;
export const SHORT_HOURS_BEFORE = 6;
export const LONG_HOURS_FROM = 17;
export const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const BLOCKS_PER_WEEK = WEEK_SECONDS / BLOCK_SECONDS;
const SERIES_NAME = 'Norm Macdonald Live';

function mix(a, b) {
  let h = (a ^ 0x9e3779b9) + Math.imul(b ^ 0x85ebca6b, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 0;
}

function textHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function clock(text) {
  const [hours, minutes] = text.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

export function classify(duration) {
  if (duration < AD_MAX) return 'ad';
  if (duration < MONTAGE_MAX) return 'montage';
  return duration <= EPISODE_MAX ? 'episode' : 'movie';
}

function unitOf(url, seek, duration, title, episode) {
  return { id: textHash(url + '#' + seek).toString(36), url, seek, dur: Math.floor(duration), title, episode };
}

function seriesUnits(weeks) {
  const units = new Map();
  for (const week of weeks) {
    const lengths = new Map(week.s.map(slot => [slot[2], slot[3]]));
    for (const [id, [title, episode, url]] of Object.entries(week.v)) {
      if (!lengths.has(id) || units.has(url)) continue;
      const m = /S(\d+)E(\d+)/.exec(episode);
      if (!m) throw new Error('episode without season and number: ' + episode);
      units.set(url, { ...unitOf(url, 0, lengths.get(id), title, episode), season: Number(m[1]), number: Number(m[2]) });
    }
  }
  return [...units.values()];
}

function filmTitle(url) {
  const name = decodeURIComponent(new URL(url).pathname.split('/').pop());
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim();
}

function catalogUnits(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.url) continue;
    if (!groups.has(entry.url)) groups.set(entry.url, []);
    groups.get(entry.url).push(entry);
  }
  return [...groups].sort(([a], [b]) => (a < b ? -1 : 1)).map(([url, list]) => {
    const seeks = [...new Set(list.map(e => e.seek || 0))].sort((a, b) => a - b);
    const step = list[0].d;
    let duration = Math.min(...list.map(e => e.d));
    if (seeks.length > 1) {
      if (!list.every(e => e.d === step)) throw new Error('sliced file with uneven slices: ' + url);
      seeks.forEach((s, i) => { if (Math.abs(s - i * step) > i + 1) throw new Error('slices of ' + url + ' are not contiguous at ' + s); });
      duration = seeks[seeks.length - 1] + step;
    }
    const title = list[0].title.replace(/\s+/g, ' ').trim();
    const unit = unitOf(url, seeks.length > 1 ? 0 : seeks[0], duration, title, '');
    return classify(unit.dur) === 'movie' ? { ...unit, title: filmTitle(url) } : unit;
  });
}

export function buildPool(weeks, catalog, extra = { items: [], dead: [] }) {
  const episodes = seriesUnits(weeks);
  const order = INTERLEAVE_SEASONS
    ? (a, b) => a.number - b.number || a.season - b.season
    : (a, b) => a.season - b.season || a.number - b.number;
  const dead = new Set(UNPLAYABLE_URLS.concat(extra.dead));
  const extraUnits = extra.items.filter(item => !dead.has(item.url)).map(item => ({
    ...unitOf(item.url, 0, item.dur, item.title, item.episode || ''), series: item.series || '',
  }));
  const units = catalogUnits(catalog.filter(entry => !dead.has(entry.url))).concat(extraUnits);
  const groups = new Map();
  for (const unit of units.filter(u => classify(u.dur) === 'episode')) {
    const name = unit.series || unit.title;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(unit);
  }
  const ranked = [...groups].sort(([a, x], [b, y]) => y.length - x.length || (a < b ? -1 : 1)).map(([name, list]) => ({ name, episodes: list }));
  const room = SERIES_TIERS.length * 7 - 1;
  const series = [{ name: SERIES_NAME, episodes: episodes.sort(order) }].concat(ranked.slice(0, room));
  const counts = { ad: 0, montage: 0, episode: 0, movie: 0 };
  for (const unit of episodes.concat(units)) counts[classify(unit.dur)]++;
  return {
    series,
    movies: units.filter(u => classify(u.dur) === 'movie' && u.dur <= MOVIE_MAX),
    unslotted: ranked.slice(room).map(s => s.name),
    clips: units.filter(u => classify(u.dur) === 'montage'),
    ads: units.filter(u => classify(u.dur) === 'ad'),
    counts,
  };
}

export function rotationWeeks(pool) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const cycles = pool.series.map(s => s.episodes.length).concat(pool.movies.length ? [pool.movies.length] : []);
  return cycles.reduce(lcm, 1);
}

function weekPrograms(pool, weekIndex) {
  const programs = pool.series.map((series, i) => {
    if (Math.floor(i / 7) >= SERIES_TIERS.length) throw new Error('no weekly slot left for series ' + series.name);
    const start = ((i + SERIES_FIRST_DAY) % 7) * DAY_SECONDS + clock(SERIES_TIERS[Math.floor(i / 7)]);
    return { start, unit: series.episodes[weekIndex % series.episodes.length], show: series.name, kind: 'show' };
  });
  if (pool.movies.length) {
    for (let day = 0; day < 7; day++) {
      MOVIE_TIMES.forEach((time, slot) => {
        const unit = pool.movies[(slot + weekIndex + day) % pool.movies.length];
        programs.push({ start: day * DAY_SECONDS + clock(time), unit, show: unit.title, kind: 'movie' });
      });
    }
  }
  return programs.sort((a, b) => a.start - b.start);
}

function chooseFrom(candidates, ctx) {
  const byShow = new Map();
  for (const clip of candidates) {
    if (!byShow.has(clip.title)) byShow.set(clip.title, []);
    byShow.get(clip.title).push(clip);
  }
  let best = null;
  let bestScore = Infinity;
  for (const show of [...byShow.keys()].sort()) {
    const score = (ctx.tally.get(show) || 0) + mix(ctx.week * 100003 + ctx.t, textHash(show)) % 900;
    if (score < bestScore) { best = show; bestScore = score; }
  }
  const sorted = byShow.get(best).sort((a, b) => a.dur - b.dur || (a.id < b.id ? -1 : 1));
  const hour = Math.floor((ctx.t % DAY_SECONDS) / 3600);
  let band = sorted;
  if (hour < SHORT_HOURS_BEFORE) band = sorted.slice(0, Math.ceil(sorted.length / 2));
  else if (hour >= LONG_HOURS_FROM) band = sorted.slice(Math.floor(sorted.length / 2));
  if (!ctx.rotation.has(best)) ctx.rotation.set(best, mix(ctx.week, textHash(best)));
  const turn = ctx.rotation.get(best);
  ctx.rotation.set(best, turn + 1);
  return band[turn % band.length];
}

function pickClip(pool, ctx) {
  const free = c => c.title !== ctx.prev && !(c.dur === ctx.rem && c.title === ctx.nextShow);
  const fits = pool.clips.filter(c => c.dur <= ctx.rem && free(c));
  if (fits.length) return chooseFrom(fits, ctx);
  const ads = ctx.adUsed ? [] : pool.ads.filter(c => c.dur <= ctx.rem && free(c));
  if (ads.length) { ctx.adUsed = true; return chooseFrom(ads, ctx); }
  const cuts = pool.clips.filter(c => c.dur > ctx.rem && c.title !== ctx.prev && c.title !== ctx.nextShow);
  if (!cuts.length) throw new Error('no clip can fill ' + ctx.rem + 's at week second ' + ctx.t + ' after ' + ctx.prev);
  return chooseFrom(cuts, ctx);
}

function openingShow(pool, weekIndex) {
  return buildWeek(pool, weekIndex, { nextShow: null, blocks: 1 })[0].title;
}

export function buildWeek(pool, weekIndex, options = {}) {
  if (!Number.isInteger(weekIndex) || weekIndex < 0) throw new Error('week index must be a non-negative integer, got ' + weekIndex);
  if (!pool.clips.length) throw new Error('the pool has no montage clips to fill with');
  const weekEndShow = options.nextShow === undefined ? openingShow(pool, weekIndex + 1) : options.nextShow;
  const limit = options.blocks || BLOCKS_PER_WEEK;
  const starts = new Map();
  for (const program of weekPrograms(pool, weekIndex)) {
    if (program.start % BLOCK_SECONDS) throw new Error(program.show + ' does not start on a half hour: ' + program.start);
    starts.set(program.start / BLOCK_SECONDS, program);
  }
  const items = [];
  const tally = new Map();
  const rotation = new Map();
  const state = { prev: null };
  const put = (start, end, unit, kind, show) => {
    items.push({
      t: start, end, v: unit.id, d: unit.dur, title: show, episode: unit.episode, url: unit.url,
      kind, seek: unit.seek, week: weekIndex, day: DAY_NAMES[Math.floor(start / DAY_SECONDS)],
    });
    tally.set(show, (tally.get(show) || 0) + end - start);
    state.prev = show;
  };
  const fill = (from, seconds) => {
    const stop = from + seconds;
    const after = starts.get(stop / BLOCK_SECONDS);
    const ctx = { week: weekIndex, tally, rotation, adUsed: false, nextShow: stop >= WEEK_SECONDS ? weekEndShow : after ? after.show : null };
    for (let t = from; t < stop;) {
      Object.assign(ctx, { t, rem: stop - t, prev: state.prev });
      const clip = pickClip(pool, ctx);
      const end = t + Math.min(clip.dur, stop - t);
      put(t, end, clip, clip.dur < AD_MAX ? 'ad' : 'montage', clip.title);
      t = end;
    }
  };
  for (let block = 0; block < limit;) {
    const program = starts.get(block);
    if (!program) { fill(block * BLOCK_SECONDS, BLOCK_SECONDS); block++; continue; }
    const span = Math.ceil(program.unit.dur / BLOCK_SECONDS);
    if (block + span > BLOCKS_PER_WEEK) throw new Error(program.show + ' runs past the end of the week');
    for (let k = 1; k < span; k++) if (starts.has(block + k)) throw new Error(program.show + ' overlaps ' + starts.get(block + k).show);
    const start = block * BLOCK_SECONDS;
    put(start, start + program.unit.dur, program.unit, program.kind, program.show);
    fill(start + program.unit.dur, span * BLOCK_SECONDS - program.unit.dur);
    block += span;
  }
  return items;
}

export function guideRows(schedule) {
  const rows = [];
  let reel = null;
  for (const entry of schedule) {
    if (entry.t >= WEEK_SECONDS) break;
    if (entry.kind === 'show' || entry.kind === 'movie') {
      rows.push({ t: entry.t, title: entry.title, detail: entry.episode.replace(/^.* - (S\d+E\d+).*$/, '$1') });
      reel = null;
      continue;
    }
    const block = Math.floor(entry.t / BLOCK_SECONDS);
    if (!reel || reel.block !== block) {
      reel = { block, row: { t: entry.t, title: 'clip reel', detail: [] } };
      rows.push(reel.row);
    }
    if (!reel.row.detail.includes(entry.title)) reel.row.detail.push(entry.title);
  }
  return rows.map(r => ({ ...r, detail: Array.isArray(r.detail) ? r.detail.join(', ') : r.detail }));
}
