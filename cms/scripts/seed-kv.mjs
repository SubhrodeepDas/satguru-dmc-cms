// One-time seed: copies every cms/data/*.json collection into Upstash Redis so
// the deployed CMS starts with all the content you built locally.
//
// Usage (from the cms/ folder):
//   1. Put your Upstash credentials in cms/.env.local:
//        UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
//        UPSTASH_REDIS_REST_TOKEN=xxxxxxxx
//      (copy them from the Upstash tab of your Vercel project → Storage)
//   2. node scripts/seed-kv.mjs
//
// Safe to re-run — it overwrites each collection key with the local file's contents.

import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CMS_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(CMS_DIR, 'data');

// Minimal .env.local loader (no dependency) so credentials can live in a file.
function loadEnvLocal() {
  const envPath = path.join(CMS_DIR, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvLocal();

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error(
    'Missing Upstash credentials.\n' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in cms/.env.local, then re-run.'
  );
  process.exit(1);
}

const redis = new Redis({ url, token });

const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')) : [];
if (!files.length) {
  console.error('No JSON files found in cms/data/ — nothing to seed.');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const slug = file.replace(/\.json$/, '');
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8').trim();
  const docs = raw ? JSON.parse(raw) : [];
  await redis.set('col:' + slug, docs);
  console.log(`seeded col:${slug} (${docs.length} item${docs.length === 1 ? '' : 's'})`);
  total += docs.length;
}

console.log(`\nDone — ${files.length} collections, ${total} items pushed to Upstash.`);
