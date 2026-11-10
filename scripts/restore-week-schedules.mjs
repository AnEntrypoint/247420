#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'tv', 'schedule_weeks', 'station_1');
const write = process.argv.includes('--write');

function die(message) {
  throw new Error(message);
}

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
if (manifest.format !== '247420-week-schedules-v2' || manifest.compression !== 'brotli') {
  die('unsupported archive manifest: ' + JSON.stringify({ format: manifest.format, compression: manifest.compression }));
}
const packed = fs.readFileSync(path.join(DIR, manifest.archive));
const raw = zlib.brotliDecompressSync(packed);
if (raw.length !== manifest.rawBytes) die('archive size is ' + raw.length + ', expected ' + manifest.rawBytes);
const rawSha = crypto.createHash('sha256').update(raw).digest('hex');
if (rawSha !== manifest.sha256) die('archive sha256 is ' + rawSha + ', expected ' + manifest.sha256);
if (manifest.files.length !== manifest.count) die('manifest declares ' + manifest.count + ' weeks but lists ' + manifest.files.length);

let offset = 0;
for (const entry of manifest.files) {
  if (entry.offset !== offset) die('non-contiguous offset for ' + entry.name + ': ' + entry.offset + ' vs ' + offset);
  const bytes = raw.subarray(entry.offset, entry.offset + entry.bytes);
  if (bytes.length !== entry.bytes) die('truncated week: ' + entry.name);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha !== entry.sha256) die('checksum mismatch for ' + entry.name + ': ' + sha + ' vs ' + entry.sha256);
  const parsed = JSON.parse(bytes.toString('utf8'));
  if (!parsed || !parsed.v || !parsed.s || typeof parsed.week !== 'number') {
    die('restored week is not a schedule object: ' + entry.name);
  }
  const expectedWeek = Number(entry.name.match(/\d+/)[0]);
  if (parsed.week !== expectedWeek) die('week number mismatch for ' + entry.name + ': ' + parsed.week);
  if (write) fs.writeFileSync(path.join(DIR, entry.name), bytes);
  offset += entry.bytes;
}
if (offset !== raw.length) die('archive has ' + (raw.length - offset) + ' trailing bytes');

console.log('week archive: ' + manifest.count + ' weeks, ' + raw.length + ' raw bytes, ' + packed.length + ' brotli bytes' + (write ? ' — restored' : ' — verified'));
