import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, DENY } from './pool-filters.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('usage: node scripts/build-tv-pool.mjs <discovery-dir containing meta.jsonl and disc/>');

const ANTHOLOGIES = {
  datamosh: 'Glitch Channel',
  netart: 'Net Art Theater',
  found: 'Found Footage Hour',
  experimental: 'Experimental Hour',
  demoscene: 'Demoscene Showcase',
  vapor: 'Aesthetic Loops Late Show',
  cursed: 'Cursed Cinema',
  pd: 'Public Domain Oddities',
  more: 'Weird Video Art Hour',
  commons: 'Commons Cinema',
};
const WARN = /horror|blood|kill|death|dead|war\b|violence|drug|cigarette|smoking|bikini|girlie|burlesque|gore|gory|creepypasta|nude|sex/i;
const FREE_LICENSE = /^(CC|Public domain|PD|GFDL|FAL|Attribution)/i;

const denied = {};
const deniedItems = [];
const deny = (text, title, dl) => {
  for (const name of Object.keys(DENY)) if (DENY[name].test(text)) { denied[name] = (denied[name] || 0) + 1; deniedItems.push({ title, dl, why: name }); return name; }
  return undefined;
};
const downloads = new Map();
if (fs.existsSync(path.join(input, 'candidates.json'))) for (const c of JSON.parse(fs.readFileSync(path.join(input, 'candidates.json'), 'utf8'))) downloads.set(c.id, c.dl || 0);
const archiveText = new Map();
const commonsText = new Map();
for (const file of fs.readdirSync(input)) {
  if (/^desc-.*\.jsonl$/.test(file)) for (const line of fs.readFileSync(path.join(input, file), 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(line); if (r.ok) archiveText.set(r.id, [r.description, r.subject, r.collection.join(' '), r.creator].join(' ')); }
  if (file === 'cdesc.jsonl') for (const line of fs.readFileSync(path.join(input, file), 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(line); commonsText.set(r.title, [r.description, r.categories.join(' ')].join(' ')); }
}
const stats = { archiveItems: 0, dropped: {}, bySource: {}, byTheme: {} };
const count = (bucket, key) => { bucket[key] = (bucket[key] || 0) + 1; };
const scores = new Map();
const scoresDir = path.join(input, 'scores');
if (fs.existsSync(scoresDir)) for (const f of fs.readdirSync(scoresDir).filter(f => /^out-.*\.json$/.test(f))) for (const r of JSON.parse(fs.readFileSync(path.join(scoresDir, f), 'utf8'))) scores.set(r.k, r);
const scoreGate = (key) => {
  if (!scores.size) return { s: 3 };
  const r = scores.get(key);
  if (!r) { count(stats.dropped, 'unscored'); return null; }
  if (r.flag) { count(stats.dropped, 'scorer-flagged'); return null; }
  if (r.s < 3) { count(stats.dropped, 'score-below-3'); return null; }
  return r;
};
const ANTHOLOGY_RULES = [
  [/glitch|datamosh|video synth|analog video|net art|vaporwave|synthwave/i, 'Glitch Channel'],
  [/demoscene|8-bit|chiptune|\bintro\b|amiga|atari|c64|pixel/i, 'Demoscene Showcase'],
  [/commercial|advert|\bident\b|bumper/i, 'Ad Break Theater'],
  [/trailer/i, 'Trailer Trash Theater'],
  [/cartoon|animat|betty boop|popeye|fleischer|stop.?motion/i, 'Cartoon Cabinet'],
  [/surreal|absurd|experimental|abstract/i, 'Weird Cinema'],
];
const anthologyOf = (text, theme) => (ANTHOLOGY_RULES.find(([re]) => re.test(text)) || [])[1] || ANTHOLOGIES[theme] || 'Weird Late Show';
const screened = {};
const unjudged = [];
const words = {};
const screen = (text) => {
  for (const name of Object.keys(CATEGORIES)) {
    const hit = CATEGORIES[name].exec(text);
    if (hit) { words[name + ':' + hit[0].toLowerCase()] = (words[name + ':' + hit[0].toLowerCase()] || 0) + 1; return name; }
  }
  return undefined;
};
if (fs.existsSync(path.join(input, 'units.json'))) for (const u of JSON.parse(fs.readFileSync(path.join(input, 'units.json'), 'utf8'))) if (u.k.startsWith('archive.org/') && !archiveText.has(u.k.slice(12))) archiveText.set(u.k.slice(12), [u.desc, u.subj, u.col].join(' '));
const lines = fs.readdirSync(input).filter(f => /^meta(-new-\d+)?\.jsonl$/.test(f)).flatMap(f => fs.readFileSync(path.join(input, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
const items = [];
const unlicensed = [];
const borderline = [];


const seenIds = new Set();
for (const m of lines) {
  if (seenIds.has(m.id)) continue;
  seenIds.add(m.id);
  if (m.dropped) { count(stats.dropped, m.dropped); continue; }
  stats.archiveItems++;
  if (!m.files.length) { count(stats.dropped, 'no-playable-file'); continue; }
  const theme = m.themes[0];
  const multi = m.files.length > 1;
  const distinct = new Map();
  for (const f of m.files) {
    const key = f.name.replace(/\.ia(\.[a-z0-9]+)$/i, '$1').replace(/\.[a-z0-9]+$/i, '').toLowerCase() + ':' + Math.round(f.dur / 5);
    if (!distinct.has(key)) distinct.set(key, f);
  }
  const records = [...distinct.values()].map(f => ({
    title: m.title.replace(/\s+/g, ' ').trim(),
    series: '',
    episode: multi ? f.name.replace(/\.ia(\.[a-z0-9]+)$/i, '$1').replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ') : m.title.replace(/\s+/g, ' ').trim(),
    url: 'https://archive.org/download/' + m.id + '/' + f.name.split('/').map(encodeURIComponent).join('/'),
    dur: f.dur,
    tags: m.tags,
    rights: m.rights,
    theme,
    source: 'archive.org/' + m.id,
  }));
  const long = records.filter(r => r.dur >= 1200 && r.dur <= 3660);
  if (multi && long.length >= 2) long.forEach(r => { r.series = m.title.replace(/\s+/g, ' ').trim(); });
  for (const r of records) if (!r.series && r.dur >= 1200 && r.dur <= 3660) r.series = anthologyOf(m.title + ' ' + m.tags.join(' '), theme);
  if (!m.rights) { unlicensed.push(...records); continue; }
  const category = screen(m.title + ' ' + m.tags.join(' ') + ' ' + (archiveText.get(m.id) || ''));
  if (category || m.warn || WARN.test(m.title)) {
    const why = category || 'title keyword';
    screened[why] = (screened[why] || 0) + 1;
    borderline.push(...records.map(r => ({ title: r.title, url: r.url, why })));
    continue;
  }
  if (deny(m.title + ' ' + m.tags.join(' ') + ' ' + m.col.join(' ') + ' ' + (archiveText.get(m.id) || ''), m.title, downloads.get(m.id) || 0)) { borderline.push(...records.map(r => ({ title: r.title, url: r.url, why: 'deny genre' }))); continue; }
  if (!archiveText.get(m.id) && !m.curated) unjudged.push(...records.map(r => ({ title: r.title, url: r.url, why: 'no description or subjects fetched' })));
  const verdict = scoreGate('archive.org/' + m.id);
  if (!verdict) continue;
  for (const r of records) { r.score = verdict.s; if (verdict.why) r.why = verdict.why; }
  items.push(...records);
  for (const r of records) { count(stats.bySource, 'archive.org'); count(stats.byTheme, theme); }
}

const commonsFiles = ['disc', 'disc2'].flatMap(dir => (fs.existsSync(path.join(input, dir)) ? fs.readdirSync(path.join(input, dir)).filter(f => /^c2?-/.test(f)).map(f => path.join(input, dir, f)) : []));
const commonsSeen = new Set();
let commonsPages = 0;
for (const file of commonsFiles) {
  for (const page of JSON.parse(fs.readFileSync(file, 'utf8')).pages) {
    const info = (page.imageinfo || [])[0];
    if (!info || commonsSeen.has(page.title)) continue;
    commonsSeen.add(page.title);
    commonsPages++;
    if (info.mime !== 'video/webm' || !(info.duration >= 5) || info.size >= 200e6) { count(stats.dropped, 'commons-not-playable'); continue; }
    const license = (info.extmetadata && info.extmetadata.LicenseShortName && info.extmetadata.LicenseShortName.value) || '';
    const title = page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
    const record = {
      title, series: info.duration >= 1200 && info.duration <= 3660 ? ANTHOLOGIES.commons : '', episode: title,
      url: info.url.split('?')[0], dur: Math.round(info.duration), tags: [], rights: 'commons:' + license, theme: 'commons', source: 'commons.wikimedia.org',
    };
    if (!FREE_LICENSE.test(license)) { unlicensed.push(record); continue; }
    const commonsBody = commonsText.get(page.title) || (((info.extmetadata || {}).ImageDescription || {}).value || '') + ' ' + (page.categories || []).map(c => c.title).join(' ');
    const commonsCategory = screen(title + ' ' + commonsBody);
    if (commonsCategory || WARN.test(title)) {
      const why = commonsCategory || 'title keyword';
      screened[why] = (screened[why] || 0) + 1;
      borderline.push({ title, url: record.url, why });
      continue;
    }
    if (deny(title + ' ' + commonsBody, title, 0)) { borderline.push({ title, url: record.url, why: 'deny genre' }); continue; }
    if (!commonsBody.trim()) unjudged.push({ title, url: record.url, why: 'no description fetched' });
    const commonsVerdict = scoreGate('commons:' + decodeURIComponent(info.url.split('?')[0].split('/').pop()));
    if (!commonsVerdict) continue;
    record.score = commonsVerdict.s;
    if (commonsVerdict.why) record.why = commonsVerdict.why;
    items.push(record);
    count(stats.bySource, 'commons');
    count(stats.byTheme, 'commons');
  }
}

const byUrl = new Map();
for (const item of items) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
const FAMILY_CAP = 10;
const families = new Map();
const capped = [...byUrl.values()].filter(item => !deny(item.episode + ' ' + item.series, item.title, 0)).filter(item => !screen(item.episode + ' ' + item.series + ' ' + item.title)).filter(item => {
  const family = item.title.toLowerCase().replace(/[-_ .\d]+$/, '');
  families.set(family, (families.get(family) || 0) + 1);
  return families.get(family) <= FAMILY_CAP;
});
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'schedule.json'), 'utf8'));
const catalogDenied = entry => Object.entries(DENY).some(([name, re]) => name !== 'bland-compilation' && re.test(entry.title)) || Object.values(CATEGORIES).some(re => re.test(entry.title));
const offAir = [...new Set(catalog.filter(entry => entry.url && catalogDenied(entry)).map(entry => entry.url))];
const pool = { generated: new Date().toISOString().slice(0, 10), checked: null, dead: [], offAir, items: capped.sort((a, b) => (a.url < b.url ? -1 : 1)) };
fs.writeFileSync(path.join(root, 'lib/pool.json'), JSON.stringify(pool));
fs.writeFileSync(path.join(root, 'tv/pool-unlicensed.json'), JSON.stringify({ note: 'not on air: rights unknown, awaiting owner decision', items: unlicensed }));
fs.writeFileSync(path.join(root, 'tv/pool-borderline.json'), JSON.stringify({ note: 'not on air: borderline content, awaiting owner decision', items: borderline }));
fs.writeFileSync(path.join(root, 'tv/pool-unjudged.json'), JSON.stringify({ note: 'on air judged by title only, no description available', items: unjudged }));
console.log('deny categories', JSON.stringify(denied));
console.log('25 highest-download items removed by the deny filter:');
for (const item of deniedItems.sort((a, b) => b.dl - a.dl).slice(0, 25)) console.log('  ' + item.dl + ' ' + item.why + ' | ' + item.title.slice(0, 70));
console.log(JSON.stringify({ matchedWords: Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 25), screened, unjudged: unjudged.length, onAir: pool.items.length, unlicensed: unlicensed.length, borderline: borderline.length, commonsPages, ...stats }, null, 1));
