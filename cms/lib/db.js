import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';
import { getCollection } from './collections';

// ─────────────────────────────────────────────────────────────────────────────
// Dual-backend storage.
//   • Production (Vercel): Upstash Redis — one JSON array per collection, keyed
//     "col:<slug>". Chosen automatically when the Upstash REST env vars exist.
//   • Local dev: plain JSON files under cms/data/ (unchanged behaviour), so the
//     project keeps working on your machine with zero external accounts.
// The public API (readAll/writeAll/getById/create/update/remove) is async either
// way, so callers don't need to know which backend is active.
// ─────────────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const KEY_PREFIX = 'col:';

let _redis; // undefined until first resolved; null means "use local files"
function getRedis() {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

async function readStore(slug) {
  const redis = getRedis();
  if (redis) {
    let data = await redis.get(KEY_PREFIX + slug);
    // @upstash/redis normally auto-parses JSON, but guard against a value that
    // came back as a raw JSON string (double-encoded) just in case.
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        /* leave as-is */
      }
    }
    return Array.isArray(data) ? data : [];
  }
  const fp = path.join(DATA_DIR, slug + '.json');
  try {
    const raw = await fs.readFile(fp, 'utf-8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(slug, docs) {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY_PREFIX + slug, docs);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  // temp-file + rename so readers never observe a half-written file
  const fp = path.join(DATA_DIR, slug + '.json');
  const tmp = fp + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(docs, null, 2), 'utf-8');
  await fs.rename(tmp, fp);
}

export async function readAll(slug) {
  return readStore(slug);
}

// Shared by /api/contact and /api/quote — both require the visitor to have
// confirmed a 6-digit code sent to the email they typed (see
// /api/verify-email/*) before their submission is accepted.
export async function isEmailVerified(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const verified = await readStore('email-verifications');
  const entry = verified.find((v) => v.email === normalized);
  return Boolean(entry && entry.expiresAt > Date.now());
}

// Enforce a per-collection cap on how many docs may have a boolean flag set to
// true (e.g. only 5 Explore Listings can be featured on the home page). Only
// blocks when the change *turns the flag on* and the cap is already reached, so
// editing an already-featured item never gets stuck. Returns an error string to
// show the user, or null when the change is allowed.
export async function checkFeatureLimit(slug, body, existingDoc) {
  const limit = getCollection(slug)?.featureLimit;
  if (!limit) return null;
  const { field, max, label } = limit;
  const turningOn = body[field] === true && !(existingDoc && existingDoc[field] === true);
  if (!turningOn) return null;
  const docs = await readStore(slug);
  const count = docs.filter((d) => d[field] === true).length;
  if (count >= max) {
    return `Only ${max} can be shown on the ${label || 'home page'} at once. Turn one off first, then try again.`;
  }
  return null;
}

export async function writeAll(slug, docs) {
  return writeStore(slug, docs);
}

export async function getById(slug, id) {
  const docs = await readStore(slug);
  return docs.find((d) => String(d.id) === String(id)) || null;
}

export async function create(slug, doc) {
  const docs = await readStore(slug);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  const newDoc = { ...doc, id, createdAt: now, updatedAt: now };
  docs.push(newDoc);
  await writeStore(slug, docs);
  return newDoc;
}

export async function update(slug, id, patch) {
  const docs = await readStore(slug);
  const idx = docs.findIndex((d) => String(d.id) === String(id));
  if (idx === -1) return null;
  docs[idx] = { ...docs[idx], ...patch, id: docs[idx].id, updatedAt: new Date().toISOString() };
  await writeStore(slug, docs);
  return docs[idx];
}

export async function remove(slug, id) {
  const docs = await readStore(slug);
  const next = docs.filter((d) => String(d.id) !== String(id));
  if (next.length === docs.length) return false;
  await writeStore(slug, next);
  return true;
}

function coerceValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && raw != null && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

export function parseWhere(searchParams) {
  const where = {};
  for (const key of searchParams.keys()) {
    const m = key.match(/^where\[(.+?)\]\[(.+?)\]$/);
    if (m) {
      const [, field, op] = m;
      where[field] = where[field] || {};
      where[field][op] = coerceValue(searchParams.get(key));
    }
  }
  return where;
}

export function applyWhere(docs, where) {
  const entries = Object.entries(where);
  if (!entries.length) return docs;
  return docs.filter((doc) =>
    entries.every(([field, ops]) =>
      Object.entries(ops).every(([op, val]) => {
        const docVal = doc[field];
        switch (op) {
          case 'equals':
            return docVal === val;
          case 'not_equals':
            return docVal !== val;
          case 'contains':
            return typeof docVal === 'string' && docVal.toLowerCase().includes(String(val).toLowerCase());
          case 'in':
            return String(val).split(',').includes(String(docVal));
          default:
            return true;
        }
      })
    )
  );
}

// Public origin for absolute /uploads URLs in API responses.
// Set CMS_PUBLIC_URL=http://194.67.119.189:10006 on the server so images never
// come back as http://localhost:10006/... (blocked by the browser from a public IP).
export function getPublicOrigin(requestUrl) {
  const env = process.env.CMS_PUBLIC_URL;
  if (env) return String(env).replace(/\/$/, '');
  return new URL(requestUrl).origin;
}

const LOCAL_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/;

function normalizeUploadString(value, origin) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('/uploads/')) return origin + value;
  if (LOCAL_ORIGIN_RE.test(value) && value.includes('/uploads/')) {
    return origin + value.replace(/^https?:\/\/[^/]+/, '');
  }
  return value;
}

function stripToUploadPath(value, origin) {
  if (typeof value !== 'string') return value;
  if (value.startsWith(origin + '/uploads/')) return value.slice(origin.length);
  if (LOCAL_ORIGIN_RE.test(value) && value.includes('/uploads/')) {
    return value.replace(/^https?:\/\/[^/]+/, '');
  }
  return value;
}

// Uploaded files stored as relative paths ("/uploads/xyz.jpg") get resolved to
// absolute URLs against the request origin on the way out, so the public site
// (a different origin) can use them directly as <img src>. Absolute URLs (e.g.
// Vercel Blob URLs from production uploads) are left untouched.
export function qualifyUrls(value, origin) {
  if (typeof value === 'string') {
    return normalizeUploadString(value, origin);
  }
  if (Array.isArray(value)) {
    return value.map((v) => qualifyUrls(v, origin));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = qualifyUrls(v, origin);
    return out;
  }
  return value;
}

// Reverse of qualifyUrls — strips this origin back off before writing, so a doc
// loaded into the admin edit form (absolute URLs) and resubmitted verbatim
// doesn't bake a hardcoded origin into storage.
export function dequalifyUrls(value, origin) {
  if (typeof value === 'string') {
    return stripToUploadPath(value, origin);
  }
  if (Array.isArray(value)) {
    return value.map((v) => dequalifyUrls(v, origin));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = dequalifyUrls(v, origin);
    return out;
  }
  return value;
}

export function applySort(docs, sortParam) {
  if (!sortParam) return docs;
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  const sorted = [...docs].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return desc ? sorted.reverse() : sorted;
}
