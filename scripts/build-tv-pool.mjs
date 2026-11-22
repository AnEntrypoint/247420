import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const CATEGORIES = {
  'real-violence': /murder|ambush|shooting|shot dead|body[- ]?cam|dashcam|deputies|\bpolice\b|lethal|killed|manhunt|crime scene|autopsy|stabbing|homicide|massacre|hostage|execution|beheading|bodycam|assassin|\bbombs?\b|\bbombing\b/i,
  'war-atrocity-extremism': /nazi|hitler|third reich|wehrmacht|swastika|holocaust|genocide|gustloff|\bisis\b|terror|jihad|\bkkk\b|white power|supremacist/i,
  hate: /\bhate\b|racist|slur/i,
  sexual: /porn|\bxxx\b|\bsex(ual|y)?\b|erotic|nude|naked|fetish|hentai|strip(per|tease)|nsfw|lingerie|bdsm/i,
  'gore-self-harm': /\bgore\b|\bgory\b|snuff|corpse|suicide|self[- ]harm|torture|mutilat|dismember|cadaver/i,
  harassment: /doxx|harass|stalker|revenge porn|swatting/i,
  tragedy: /tragedy|victims?\b|funeral|died in/i,
};
const FREE_LICENSE = /^(CC|Public domain|PD|GFDL|FAL|Attribution)/i;

const archiveText = new Map();
const commonsText = new Map();
for (const file of fs.readdirSync(input)) {
  if (/^desc-.*\.jsonl$/.test(file)) for (const line of fs.readFileSync(path.join(input, file), 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(line); if (r.ok) archiveText.set(r.id, [r.description, r.subject, r.collection.join(' '), r.creator].join(' ')); }
  if (file === 'cdesc.jsonl') for (const line of fs.readFileSync(path.join(input, file), 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(line); commonsText.set(r.title, [r.description, r.categories.join(' ')].join(' ')); }
}
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
const lines = fs.readFileSync(path.join(input, 'meta.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const items = [];
const unlicensed = [];
const borderline = [];
const stats = { archiveItems: 0, dropped: {}, bySource: {}, byTheme: {} };
const count = (bucket, key) => { bucket[key] = (bucket[key] || 0) + 1; };

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
  for (const r of records) if (!r.series && r.dur >= 1200 && r.dur <= 3660) r.series = ANTHOLOGIES[theme] || ANTHOLOGIES.pd;
  if (!m.rights) { unlicensed.push(...records); continue; }
  const category = screen(m.title + ' ' + m.tags.join(' ') + ' ' + (archiveText.get(m.id) || ''));
  if (category || m.warn || WARN.test(m.title)) {
    const why = category || 'title keyword';
    screened[why] = (screened[why] || 0) + 1;
    borderline.push(...records.map(r => ({ title: r.title, url: r.url, why })));
    continue;
  }
  if (!archiveText.get(m.id)) unjudged.push(...records.map(r => ({ title: r.title, url: r.url, why: 'no description or subjects fetched' })));
  items.push(...records);
  for (const r of records) { count(stats.bySource, 'archive.org'); count(stats.byTheme, theme); }
}

const commonsDir = path.join(input, 'disc');
const commonsSeen = new Set();
let commonsPages = 0;
for (const file of fs.readdirSync(commonsDir).filter(f => f.startsWith('c-'))) {
  for (const page of JSON.parse(fs.readFileSync(path.join(commonsDir, file), 'utf8')).pages) {
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
    const commonsCategory = screen(title + ' ' + (commonsText.get(page.title) || ''));
    if (commonsCategory || WARN.test(title)) {
      const why = commonsCategory || 'title keyword';
      screened[why] = (screened[why] || 0) + 1;
      borderline.push({ title, url: record.url, why });
      continue;
    }
    if (!commonsText.get(page.title)) unjudged.push({ title, url: record.url, why: 'no description fetched' });
    items.push(record);
    count(stats.bySource, 'commons');
    count(stats.byTheme, 'commons');
  }
}

const byUrl = new Map();
for (const item of items) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
const FAMILY_CAP = 10;
const families = new Map();
const capped = [...byUrl.values()].filter(item => {
  const family = item.title.toLowerCase().replace(/[-_ .\d]+$/, '');
  families.set(family, (families.get(family) || 0) + 1);
  return families.get(family) <= FAMILY_CAP;
});
const pool = { generated: new Date().toISOString().slice(0, 10), checked: null, dead: [], items: capped.sort((a, b) => (a.url < b.url ? -1 : 1)) };
fs.writeFileSync(path.join(root, 'lib/pool.json'), JSON.stringify(pool));
fs.writeFileSync(path.join(root, 'tv/pool-unlicensed.json'), JSON.stringify({ note: 'not on air: rights unknown, awaiting owner decision', items: unlicensed }));
fs.writeFileSync(path.join(root, 'tv/pool-borderline.json'), JSON.stringify({ note: 'not on air: borderline content, awaiting owner decision', items: borderline }));
fs.writeFileSync(path.join(root, 'tv/pool-unjudged.json'), JSON.stringify({ note: 'on air judged by title only, no description available', items: unjudged }));
console.log(JSON.stringify({ matchedWords: Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 25), screened, unjudged: unjudged.length, onAir: pool.items.length, unlicensed: unlicensed.length, borderline: borderline.length, commonsPages, ...stats }, null, 1));
