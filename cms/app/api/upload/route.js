import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { requireAuth } from '../../../lib/auth';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.pdf']);

export async function POST(req) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = path.extname(file.name || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + ext;

  // Production (Vercel): persist to Vercel Blob and return its absolute public URL.
  // Local dev: write to public/uploads and return a site-relative /uploads path.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safeName, bytes, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return NextResponse.json({ url: blob.url });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), bytes);
  return NextResponse.json({ url: '/uploads/' + safeName });
}
