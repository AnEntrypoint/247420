#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log('  [x] ' + name);
  } catch (e) {
    failures++;
    console.log('  [FAIL] ' + name + ' — ' + e.message);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log('247420 live verification\n');

console.log('index.html + main.js');
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
check('index.html has #app root and loads main.js', () => {
  assert(html.includes('id="app"'), 'no #app root');
  assert(html.includes('main.js'), 'main.js not loaded');
});

console.log('\noscraft page + TV fullscreen wiring');
const componentsSource = fs.readFileSync(ROOT + '/lib/components.js', 'utf8');
const mainSource = fs.readFileSync(ROOT + '/main.js', 'utf8');
const stylesSource = fs.readFileSync(ROOT + '/styles.css', 'utf8');
check('oscraft route links directly to the live published Pages client', () => {
  assert(/oscraft:\s*OscraftPage/.test(componentsSource), 'oscraft route is not registered');
  assert(componentsSource.includes("const playUrl = 'https://lanmower.github.io/oscraft/js/client/play.html'"), 'oscraft page does not use the live Pages client URL');
  assert(/href: playUrl/.test(componentsSource), 'oscraft page has no direct link to the client');
  assert(!/h\('iframe'/.test(componentsSource.slice(componentsSource.indexOf('function OscraftPage'), componentsSource.indexOf('function TvPage'))), 'oscraft page still embeds an iframe');
  assert(!stylesSource.includes('.oscraft-frame'), 'unused oscraft iframe CSS is still present');
  assert(!fs.existsSync(ROOT + '/scripts/fetch-oscraft-pages.mjs'), 'unused oscraft asset fetch script is still present');
});
check('TV stage has a native fullscreen control and state sync', () => {
  assert(componentsSource.includes("id: 'tv-fullscreen'"), 'TV fullscreen button missing');
  assert(mainSource.includes('window.__tvFullscreenToggle'), 'TV fullscreen handler missing');
  assert(mainSource.includes('requestFullscreen()'), 'TV fullscreen does not call requestFullscreen');
  assert(mainSource.includes('fullscreenchange'), 'TV fullscreen label does not sync on fullscreenchange');
  assert(stylesSource.includes('.tv-stage:fullscreen'), 'fullscreen TV stage CSS missing');
});

console.log('\nlegacy one-day schedule.json (kept as data, not loaded by TV)');
const schedule = JSON.parse(fs.readFileSync(ROOT + '/schedule.json', 'utf8'));
check('schedule.json parses to a non-empty array of well-shaped slots', () => {
  assert(Array.isArray(schedule) && schedule.length > 0, 'empty or not an array');
  assert(schedule.every(s => typeof s.t === 'number' && s.v && typeof s.d === 'number'), 'malformed slot');
});

console.log('\nfull TV week rotation (real module + real brotli archive)');
const weekModule = await import('file://' + ROOT.replace(/\\/g, '/') + '/lib/week-schedules.js');
const weeks = weekModule.WEEKS;
const archiveDir = ROOT + '/tv/schedule_weeks/station_1';
const weekManifest = JSON.parse(fs.readFileSync(archiveDir + '/manifest.json', 'utf8'));
const weekArchive = zlib.brotliDecompressSync(fs.readFileSync(archiveDir + '/' + weekManifest.archive));

check('week archive is one indexed brotli concatenation of every original week', () => {
  assert(weekManifest.format === '247420-week-schedules-v2', 'unexpected archive format: ' + weekManifest.format);
  assert(weekArchive.length === weekManifest.rawBytes, 'archive decoded to ' + weekArchive.length + ', expected ' + weekManifest.rawBytes);
  assert(weekManifest.files.length === weekManifest.count, 'manifest count mismatch');
  let offset = 0;
  for (const entry of weekManifest.files) {
    assert(entry.offset === offset, 'non-contiguous archive entry: ' + entry.name);
    assert(weekArchive.subarray(entry.offset, entry.offset + entry.bytes).length === entry.bytes, 'truncated week: ' + entry.name);
    offset += entry.bytes;
  }
  assert(offset === weekArchive.length, 'archive has trailing bytes');
});

check('runtime module carries all 183 weeks and 7,800 playable slots from the archive', () => {
  assert(Array.isArray(weeks) && weeks.length === weekManifest.count, 'module has ' + (weeks && weeks.length) + ' weeks, archive has ' + weekManifest.count);
  let runtimeSlots = 0;
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    assert(week.week === i + 1, 'week number out of sequence at index ' + i + ': ' + week.week);
    assert(Date.parse(week.start) === Date.parse('2025-10-11T00:00:00Z'), 'week ' + week.week + ' has unexpected epoch ' + week.start);
    assert(Array.isArray(week.days) && week.days.length === 7, 'week ' + week.week + ' lacks 7 days');
    assert(Array.isArray(week.s) && week.s.length > 0, 'week ' + week.week + ' has no slots');
    runtimeSlots += week.s.length;
    const originalBytes = weekArchive.subarray(weekManifest.files[i].offset, weekManifest.files[i].offset + weekManifest.files[i].bytes);
    const original = JSON.parse(originalBytes.toString('utf8'));
    assert(week.s.length === original.s.length, 'week ' + week.week + ' slot count differs from archive');
    assert(Object.keys(week.v).length === Object.keys(original.v).length, 'week ' + week.week + ' video catalog differs from archive');
    for (const slot of week.s) {
      const [day, clock, videoId, duration] = slot;
      assert(week.days.includes(day), 'week ' + week.week + ' has unknown day ' + day);
      assert(/^\d{1,2}:\d{2} (AM|PM)$/.test(clock), 'week ' + week.week + ' has bad clock ' + clock);
      const video = week.v[videoId];
      assert(Array.isArray(video) && /^https:\/\//.test(video[2]), 'week ' + week.week + ' slot ' + videoId + ' has no playable URL');
      assert(Number(duration) > 0, 'week ' + week.week + ' slot ' + videoId + ' has no duration');
    }
  }
  assert(runtimeSlots === 7800, 'runtime has ' + runtimeSlots + ' slots, expected 7800');
});

check('current UTC time resolves to a playable slot in the full rotation', () => {
  global.window = { __debug: {} };
  return import('file://' + ROOT.replace(/\\/g, '/') + '/lib/video.js').then(async ({ default: VideoPlayer }) => {
    const player = new VideoPlayer();
    const now = new Date();
    const schedule = await player.loadSchedule(now);
    assert(schedule.length > 0, 'selected week has no slots');
    const weekNumber = player.scheduler.getCurrentWeek(now);
    assert(weeks[weekNumber - 1].week === weekNumber, 'scheduler picked an absent week: ' + weekNumber);
    const slot = player.scheduler.getCurrentSlot(now);
    assert(!slot || /^https:\/\//.test(slot.entry.url), 'current slot is not a playable URL');
    const upcoming = player.scheduler.getUpcomingSlots(1, now);
    assert(!upcoming.length || /^https:\/\//.test(upcoming[0].entry.url), 'upcoming slot is not a playable URL');
  });
});

console.log('\nblog-posts.json');
const blogPosts = JSON.parse(fs.readFileSync(ROOT + '/lib/blog-posts.json', 'utf8'));
check('blog posts are well-shaped and sorted newest-first', () => {
  assert(Array.isArray(blogPosts), 'not an array');
  if (!blogPosts.length) return;
  assert(blogPosts.every(p => p.slug && p.title && p.publishedAt), 'missing required field');
  const dates = blogPosts.map(p => Date.parse(p.publishedAt));
  assert(dates.every((d, i) => i === 0 || d <= dates[i - 1]), 'not sorted newest-first');
  assert(blogPosts.every(p => Array.isArray(p.body) && p.body.length > 0), 'empty body');
});

console.log('\nlive project ranking (loads real lib/projects.js + lib/showcase.json)');
const showcase = JSON.parse(fs.readFileSync(ROOT + '/lib/showcase.json', 'utf8'));
global.fetch = async () => ({ ok: true, json: async () => showcase });
const projMod = await import('file://' + ROOT.replace(/\\/g, '/') + '/lib/projects.js');
await projMod.loadShowcase();

const liveWork = projMod.projects.filter(p => projMod.activityFor(p.code).tier === 2);
const ranked = projMod.rankByActivity(liveWork);

check('homepage tier===2 filter excludes anything without real commits in the showcase data', () => {
  for (const p of liveWork) {
    const e = showcase[p.code];
    assert(e && !e.archived && !e.disabled, p.code + ' (' + p.title + ') is archived/disabled but passed the filter');
    assert((e.commits14d || 0) > 0, p.code + ' (' + p.title + ') has commits14d=' + (e.commits14d || 0) + ' but was featured — dormant project leaking through');
  }
});

check('ranking is actually sorted by commits14d descending (not just filtered)', () => {
  for (let i = 1; i < ranked.length; i++) {
    const prev = projMod.activityFor(ranked[i - 1].code).commits14d;
    const cur = projMod.activityFor(ranked[i].code).commits14d;
    assert(prev >= cur, ranked[i - 1].title + ' (' + prev + ') ranked above ' + ranked[i].title + ' (' + cur + ') — out of order');
  }
});

check('projects with zero real 14-day commits are absent from the featured set entirely', () => {
  const dormantWithZeroCommits = projMod.projects.filter(p => {
    const e = showcase[p.code];
    return e && !e.archived && !e.disabled && (e.commits14d || 0) === 0;
  });
  const leaked = dormantWithZeroCommits.filter(p => liveWork.includes(p));
  assert(leaked.length === 0, 'leaked onto homepage: ' + leaked.map(p => p.title).join(', '));
});

console.log('\n  featured (' + ranked.length + '): ' + ranked.slice(0, 8).map(p => p.title).join(', ') + (ranked.length > 8 ? ', …' : ''));

console.log('\ncatalog + showcase consistency');
check('every catalog project has a showcase entry with numeric stars', () => {
  const missing = projMod.projects.filter(p => !(p.code in showcase));
  assert(missing.length === 0, 'no showcase entry: ' + missing.map(p => p.code).join(','));
  assert(Object.values(showcase).every(s => typeof (s.stars ?? 0) === 'number'), 'non-numeric stars field');
});

check('showcase entries carry activity fields needed by activityFor', () => {
  const bad = Object.values(showcase).filter(s => !('pushedAt' in s) || !('archived' in s) || !('commits14d' in s));
  assert(bad.length === 0, bad.length + ' entries missing pushedAt/archived/commits14d');
});
console.log('\ncomponents.js wiring (does the homepage actually use tier===2?)');
const componentsSrc = fs.readFileSync(ROOT + '/lib/components.js', 'utf8');
check('HomePage works-list filter is tier===2 (excludes dormant), not merely tier!==0 (excludes only archived)', () => {
  const m = componentsSrc.match(/const live = projects\.filter\(p => activityFor\(p\.code\)\.([^)]+)\);/);
  assert(m, 'could not locate the works-list filter line in components.js — structure changed, update this check');
  assert(m[1] === 'tier === 2', 'works-list filter is `' + m[1] + '`, not `tier === 2` — dormant (non-archived, no real commits) projects will render on the homepage');
});
check('OrgPage reach-for-first second slot uses tier===2 too', () => {
  const m = componentsSrc.match(/rankByActivity\(projects\.filter\(p => p !== gmProject && activityFor\(p\.code\)\.([^)]+)\)\)\[0\]/);
  assert(m, 'could not locate reach-for-first line in components.js — structure changed, update this check');
  assert(m[1] === 'tier === 2', 'reach-for-first filter is `' + m[1] + '`, not `tier === 2`');
});

console.log('\n' + (failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
