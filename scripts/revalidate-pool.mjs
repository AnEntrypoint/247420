import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const poolFile = path.join(root, 'lib/pool.json');
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const out = flag('--out');
if (!out) throw new Error('usage: node scripts/revalidate-pool.mjs --out <results.jsonl> [--from N] [--count M] | --apply <results.jsonl>');

const wait = ms => new Promise(r => setTimeout(r, ms));
const pool = JSON.parse(fs.readFileSync(poolFile, 'utf8'));
const urls = [...new Set(pool.items.map(item => item.url))];

if (args.includes('--apply')) {
  const results = new Map(fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).map(r => [r.url, r]));
  const missing = urls.filter(u => !results.has(u));
  if (missing.length) throw new Error(missing.length + ' pool urls have no result yet, e.g. ' + missing[0]);
  pool.dead = urls.filter(u => !(results.get(u).status === 200 && /^video\//.test(results.get(u).type || '')));
  pool.checked = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(poolFile, JSON.stringify(pool));
  console.log('checked', pool.checked, 'urls', urls.length, 'dead', pool.dead.length);
  process.exit(0);
}

const done = new Set(fs.existsSync(out) ? fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).url) : []);
const from = Number(flag('--from', 0));
const count = Number(flag('--count', 100));
const started = Date.now();
let checked = 0;
for (const url of urls.slice(from, from + count)) {
  if (done.has(url)) continue;
  if (Date.now() - started > 50000) break;
  let result = { url, status: 0, type: 'unreachable' };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(new URL(url).href, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': '247420-pool-revalidate/1.0 (https://247420.xyz; 2 req/s)' } });
      result = { url, status: response.status, type: response.headers.get('content-type') || '' };
      if (response.status === 200) break;
    } catch (error) {
      result = { url, status: 0, type: String(error.message) };
    }
    await wait(2000);
  }
  fs.appendFileSync(out, JSON.stringify(result) + '\n');
  checked++;
  await wait(500);
}
console.log('batch from', from, 'checked', checked, 'of', urls.length, 'pool urls');
