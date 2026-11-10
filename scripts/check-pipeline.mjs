#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'];
const missing = required.filter(p => !fs.existsSync(path.join(root, p)));

if (missing.length) {
  console.error(`pipeline guard: missing ${missing.join(', ')}`);
  process.exit(1);
}

console.log('pipeline guard: ci.yml + deploy.yml present');
