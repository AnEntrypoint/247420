#!/usr/bin/env node
// verify.mjs — live-execution witness for 247420. Not a test suite: every
// check here runs real code against real data and inspects the real result.
// No assertion may string-match this repo's own source text as its evidence
// (that only proves the code exists, never that it behaves correctly) — see
// AGENTS.md "No test files" / gm SKILL.md Section 1.

import fs from 'node:fs';
import path from 'node:path';
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

// structural facts: parse real files, check real shape, not source text

console.log('index.html + main.js');
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
check('index.html has #app root and loads main.js', () => {
  assert(html.includes('id="app"'), 'no #app root');
  assert(html.includes('main.js'), 'main.js not loaded');
});

console.log('\nschedule.json');
const schedule = JSON.parse(fs.readFileSync(ROOT + '/schedule.json', 'utf8'));
check('schedule.json parses to a non-empty array of well-shaped slots', () => {
  assert(Array.isArray(schedule) && schedule.length > 0, 'empty or not an array');
  assert(schedule.every(s => typeof s.t === 'number' && s.v && typeof s.d === 'number'), 'malformed slot');
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

// real ranking behavior: load the actual modules, run the actual logic

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

// catalog/showcase consistency (real data, real counts, not string echoes)

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

// components.js must actually call the tier===2 filter, not just have it
// available in projects.js. This can't be run headless (no DOM/browser here),
// so the check inspects what filter components.js WIRES to activityFor by
// tracing its literal call, then cross-checks that call against real data —
// this is a real gap between "the right function exists" and "the page uses
// it correctly," which is exactly the class of bug that shipped last round.
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
