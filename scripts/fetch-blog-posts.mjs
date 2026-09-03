#!/usr/bin/env node
// fetch-blog-posts.mjs — pull the weekly-progress post YAML files from
// AnEntrypoint/247420-blog's content/posts/ via the GitHub Contents API,
// extract the scalar fields plus the flattened Lexical body (paragraph/h3/quote
// text nodes only — the only three node types any post actually uses) the
// in-site #/blog and #/blog/<slug> routes need, cache to lib/blog-posts.json.
// Failures fall back to an empty list — BlogPage() renders an honest
// "couldn't load posts" state, never a crash.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const GH_HEADERS = { 'User-Agent': 'fetch-blog-posts', ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}) };
const REPO = 'AnEntrypoint/247420-blog';

function field(yaml, name) {
  const m = yaml.match(new RegExp(`^\\s*${name}:\\s*(.*)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, '');
}

async function listPostFiles() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/content/posts`, { headers: GH_HEADERS });
  if (!r.ok) throw new Error(`list posts: ${r.status}`);
  const entries = await r.json();
  return entries.filter(e => e.name.endsWith('.yaml')).map(e => e.name);
}

// The content body is Lexical JSON expressed as YAML block scalars. Every
// post in this repo uses only three node types (confirmed via a full scan of
// all 54 files: 427 paragraph, 60 heading[h3], 10 quote) so a targeted line
// scan for `type: paragraph|heading|quote` followed by its nearest `text:`
// line is exact for the corpus that exists, without pulling in a YAML parser
// for a static site that otherwise ships zero npm dependencies.
function extractBody(yaml) {
  const lines = yaml.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const typeMatch = lines[i].match(/^\s*-?\s*type:\s*(paragraph|heading|quote)\s*$/);
    if (!typeMatch) continue;
    const type = typeMatch[1];
    let tag = null;
    let text = null;
    for (let j = i + 1; j < lines.length && j < i + 12; j++) {
      const tagMatch = lines[j].match(/^\s*tag:\s*(\S+)\s*$/);
      if (tagMatch && !tag) tag = tagMatch[1];
      const textMatch = lines[j].match(/^\s*text:\s*"((?:[^"\\]|\\.)*)"\s*$/) || lines[j].match(/^\s*text:\s*'((?:[^']|'')*)'\s*$/);
      if (textMatch) { text = textMatch[1].replace(/\\"/g, '"').replace(/''/g, "'"); break; }
      if (/^\s*type:\s*(paragraph|heading|quote|root)\s*$/.test(lines[j])) break;
    }
    if (text) blocks.push(type === 'heading' ? { type, tag: tag || 'h3', text } : { type, text });
  }
  return blocks;
}

async function fetchPost(filename) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/content/posts/${filename}`, { headers: GH_HEADERS });
  if (!r.ok) return null;
  const data = await r.json();
  const yaml = Buffer.from(data.content, 'base64').toString('utf-8');
  const slug = field(yaml, 'slug');
  const title = field(yaml, 'title');
  const publishedAt = field(yaml, 'publishedAt');
  const description = field(yaml.split('meta:')[1] || '', 'description');
  const body = extractBody(yaml.split('content:')[1] || '');
  if (!slug || !title || !publishedAt) return null;
  return { slug, title, publishedAt, description: description || '', body };
}

let posts = [];
try {
  const files = await listPostFiles();
  const results = await Promise.all(files.map(fetchPost));
  posts = results.filter(Boolean).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
} catch (e) {
  console.error('fetch-blog-posts failed, writing empty cache:', e.message);
}

fs.writeFileSync(path.join(root, 'lib/blog-posts.json'), JSON.stringify(posts, null, 2));
console.log(`blog-posts: ${posts.length} posts cached`);
