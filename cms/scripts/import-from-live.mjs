// One-off importer: pulls collections from the live Payload CMS
// (satgurudmc.excellisit.net) into this CMS's local JSON files, downloading
// each referenced image into public/uploads and rewriting image fields to
// "/uploads/<file>". Falls back to the remote URL if a download fails, so a
// flaky image never produces a broken record.
//
// Run from the cms/ folder:  node scripts/import-from-live.mjs
// Optionally pass collection slugs:  node scripts/import-from-live.mjs excursions

import fs from 'fs/promises';
import path from 'path';

const PROD = process.env.LIVE_CMS || 'https://satgurudmc.excellisit.net';
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Default = the collections that are demonstrably incomplete locally.
const DEFAULT_COLLECTIONS = ['explore-listings', 'excursions', 'tour-packages'];
const COLLECTIONS = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_COLLECTIONS;

// Payload relationship / derived fields we don't want baked into storage.
const DROP_FIELDS = new Set([
  'cityPage', 'destinationHeroImage', 'destinationImage',
  'destinationDescription', 'destinationTitle', 'imageUrl', 'sizes', 'thumbnailURL',
]);

const cache = new Map(); // remote url -> '/uploads/x' (or the remote url on failure)
let okCount = 0;
let failCount = 0;

function sanitize(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function downloadImage(url, filename) {
  if (cache.has(url)) return cache.get(url);
  const safe = sanitize(filename || url.split('/').pop().split('?')[0] || 'img');
  const dest = path.join(UPLOADS_DIR, safe);
  const rel = '/uploads/' + safe;
  try {
    if (!(await exists(dest))) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, buf);
    }
    cache.set(url, rel);
    okCount++;
    return rel;
  } catch (e) {
    console.warn(`    ! image download failed (${e.message}) -> keeping remote URL: ${url}`);
    cache.set(url, url);
    failCount++;
    return url;
  }
}

// Recursively walk a value; any Payload image media object becomes a local path.
async function localize(value) {
  if (Array.isArray(value)) {
    const out = [];
    for (const v of value) out.push(await localize(v));
    return out;
  }
  if (value && typeof value === 'object') {
    if (typeof value.url === 'string' && typeof value.mimeType === 'string' && value.mimeType.startsWith('image')) {
      return await downloadImage(value.url, value.filename);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (DROP_FIELDS.has(k)) continue;
      out[k] = await localize(v);
    }
    return out;
  }
  return value;
}

async function fetchAll(slug) {
  const res = await fetch(`${PROD}/api/${slug}?depth=1&limit=1000&page=1`);
  if (!res.ok) return null;
  const json = await res.json();
  return Array.isArray(json.docs) ? json.docs : [];
}

async function main() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
  console.log(`Source: ${PROD}`);
  const summary = [];
  for (const slug of COLLECTIONS) {
    process.stdout.write(`\n${slug}: fetching… `);
    let docs;
    try { docs = await fetchAll(slug); }
    catch (e) { console.log('FETCH ERROR', e.message); summary.push([slug, 'error']); continue; }
    if (docs === null) { console.log('not on live — skipped'); summary.push([slug, 'skipped']); continue; }
    process.stdout.write(`${docs.length} docs → downloading images… `);
    const clean = [];
    for (const d of docs) clean.push(await localize(d));
    const fp = path.join(DATA_DIR, slug + '.json');
    const tmp = fp + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(clean, null, 2), 'utf-8');
    await fs.rename(tmp, fp);
    console.log(`wrote ${clean.length} → data/${slug}.json`);
    summary.push([slug, clean.length]);
  }
  console.log('\n==== SUMMARY ====');
  for (const [s, n] of summary) console.log(`  ${s}: ${n}`);
  console.log(`  images: ${okCount} downloaded/cached, ${failCount} kept as remote URL`);
}

main().catch((e) => { console.error(e); process.exit(1); });
