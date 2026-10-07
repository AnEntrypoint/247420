#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SWEEP_COMMIT_RE } from './lib/sweep.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const projectsSrc = fs.readFileSync(path.join(root, 'lib/projects.js'), 'utf-8');
const m = projectsSrc.match(/export const projects = (\[[\s\S]*?\n\];)/);
if (!m) { console.error('cannot parse projects.js'); process.exit(1); }
const projects = (new Function('return ' + m[1].replace(/\];$/, ']')))();

const SITE_RE = /<script[^>]*id="__site__"[^>]*>([\s\S]*?)<\/script>/;
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const GH_HEADERS = { 'User-Agent': 'fetch-showcase', ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}) };

async function fetchRepoMeta(owner, repo) {
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: GH_HEADERS
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      stars: data.stargazers_count || 0,
      pushedAt: data.pushed_at || null,
      archived: !!data.archived,
      disabled: !!data.disabled,
    };
  } catch (e) { return null; }
}
async function fetchRealCommits14d(owner, repo) {
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&per_page=100`, {
      headers: GH_HEADERS
    });
    if (!r.ok) return 0;
    const data = await r.json();
    if (!Array.isArray(data)) return 0;
    return data.filter(c => !SWEEP_COMMIT_RE.test((c.commit?.message || '').split('\n')[0])).length;
  } catch (e) { return 0; }
}

async function fetchOne(p) {
  if (!p.url?.includes('github.com')) return { code: p.code, missing: true, stars: p.stars ?? 0, pushedAt: null, archived: false, disabled: false, commits14d: 0 };
  const [owner, repo] = p.url.split('github.com/')[1].split('/').slice(0, 2);
  const [meta, commits14d] = await Promise.all([fetchRepoMeta(owner, repo), fetchRealCommits14d(owner, repo)]);
  const stars = meta?.stars ?? p.stars ?? 0;
  const activity = { pushedAt: meta?.pushedAt ?? null, archived: meta?.archived ?? false, disabled: meta?.disabled ?? false, commits14d };

  const candidates = [];
  if (p.url && p.url.includes('github.io')) candidates.push(p.url);
  if (p.url && p.url.includes('github.com/')) {
    const slug = p.url.split('github.com/')[1].split('/')[1];
    candidates.push(`https://anentrypoint.github.io/${slug}/`);
  }
  for (const url of candidates) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) continue;
      const html = await r.text();
      const sm = html.match(SITE_RE);
      if (!sm) continue;
      const data = JSON.parse(sm[1]);
      return { code: p.code, src: url, site: data.site || null, home: data.home || null, stars, ...activity };
    } catch (e) {}
  }
  return { code: p.code, missing: true, stars, ...activity };
}

const results = await Promise.all(projects.map(fetchOne));
const showcase = Object.fromEntries(results.map(r => [r.code, r]));
const found = results.filter(r => !r.missing).length;
fs.writeFileSync(path.join(root, 'lib/showcase.json'), JSON.stringify(showcase, null, 2));
console.log(`showcase: ${found}/${results.length} projects enriched`);
