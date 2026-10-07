#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSubstantive } from './lib/sweep.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = fs.readFileSync(path.join(root, 'lib/projects.js'), 'utf8');
const m = src.match(/export const projects = (\[[\s\S]*?\n\];)/);
if (!m) { console.error('cannot parse projects.js'); process.exit(1); }
const projects = (new Function('return ' + m[1].replace(/\];$/, ']')))();
const cataloged = new Map(projects.map(p => [p.url.replace('https://github.com/', ''), p]));

const ADD_WINDOW_DAYS = Number(process.env.ADD_WINDOW_DAYS || 14);
const REMOVE_WINDOW_DAYS = Number(process.env.REMOVE_WINDOW_DAYS || 60);
const ORG = process.env.ORG || 'AnEntrypoint';
const MIN_SUBSTANTIVE = Number(process.env.MIN_SUBSTANTIVE || 2);

const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const GH_HEADERS = { 'User-Agent': 'sync-catalog', ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}) };

const DAY = 86400000;
const now = Date.now();
const since = new Date(now - REMOVE_WINDOW_DAYS * DAY).toISOString();

async function gh(url) {
  const r = await fetch(url, { headers: GH_HEADERS });
  return r.ok ? r.json() : null;
}

const repos = [];
for (let page = 1; page <= 6; page++) {
  const batch = await gh(`https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}&sort=pushed&type=all`);
  if (!Array.isArray(batch) || !batch.length) break;
  repos.push(...batch);
}

const rows = [];
async function probe(repo) {
  const commits = await gh(`https://api.github.com/repos/${repo.full_name}/commits?since=${since}&per_page=100`);
  if (!Array.isArray(commits)) return;
  const substantive = commits.filter(c => isSubstantive(c.commit?.message || ''));
  const dates = substantive.map(c => Date.parse(c.commit.author.date)).filter(Boolean);
  const lastReal = dates.length ? Math.max(...dates) : null;
  rows.push({
    full_name: repo.full_name,
    stars: repo.stargazers_count,
    archived: repo.archived,
    substantive14: dates.filter(d => d >= now - ADD_WINDOW_DAYS * DAY).length,
    daysSince: lastReal ? Math.floor((now - lastReal) / DAY) : null,
  });
}

for (let i = 0; i < repos.length; i += 12) {
  await Promise.all(repos.slice(i, i + 12).map(probe));
}

const add = rows
  .filter(r => r.substantive14 >= MIN_SUBSTANTIVE && !cataloged.has(r.full_name) && !r.archived)
  .sort((a, b) => b.substantive14 - a.substantive14);

const remove = rows
  .filter(r => cataloged.has(r.full_name))
  .filter(r => r.daysSince === null || r.daysSince > REMOVE_WINDOW_DAYS || r.archived)
  .sort((a, b) => (b.daysSince ?? 1e9) - (a.daysSince ?? 1e9));

const line = (n, r) => `  ${String(n).padStart(3)}  ${r.full_name.padEnd(38)} stars=${r.stars}`;

console.log(`catalog: ${projects.length} entries | org repos scanned: ${repos.length}`);
console.log(`\nADD (>=${MIN_SUBSTANTIVE} substantive commits in ${ADD_WINDOW_DAYS}d, not cataloged, not archived): ${add.length}`);
add.forEach((r, i) => console.log(line(r.substantive14, r)));
console.log(`\nREMOVE (cataloged, no substantive commit in ${REMOVE_WINDOW_DAYS}d, or archived): ${remove.length}`);
remove.forEach(r => console.log(`  ${r.archived ? 'ARCHIVED' : (r.daysSince === null ? '   none ' : String(r.daysSince).padStart(6) + 'd')}  ${r.full_name}  (code ${cataloged.get(r.full_name).code})`));
console.log(`\nresulting catalog size: ${projects.length - remove.length + add.length}`);
