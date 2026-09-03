#!/usr/bin/env node
// lint-glyphs — fail on non-ASCII decorative glyphs in rendered source.
// The project bans arrows/bullets/checks/emoji/box glyphs (AGENTS.md); frozen
// history lives in git + changelogs, not these files. Em dash (U+2014) is the
// one allowed piece of branding.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = new Set(['—']); // em dash
const files = [
  'main.js', 'index.html', 'test.js', 'styles.css',
  'lib/scheduler.js', 'lib/video.js',
  'lib/components.js', 'lib/projects.js',
  'scripts/fetch-showcase.mjs', 'scripts/lint-glyphs.mjs',
];

const hits = [];
for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const ch of line) {
      const cp = ch.codePointAt(0);
      if (cp > 0x7f && !ALLOWED.has(ch)) {
        hits.push(`${rel}:${i + 1}  U+${cp.toString(16).toUpperCase().padStart(4, '0')}  ${JSON.stringify(ch)}`);
      }
    }
  });
}

if (hits.length) {
  console.error('Non-ASCII decorative glyph(s) found (em dash U+2014 excepted). Convert to ASCII:');
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}
console.log('glyph guard: clean');
