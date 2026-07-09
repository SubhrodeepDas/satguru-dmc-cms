import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, getExpectedToken } from '../../../../lib/auth';

// Client-side (direct-to-Blob) upload token endpoint. The browser uploads the
// file straight to Vercel Blob and only exchanges a small JSON handshake with
// this route — so large files (e.g. multi-MB PDF brochures) bypass Vercel's
// ~4.5 MB serverless request-body limit that the plain /api/upload route hits.
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'application/pdf',
];

export async function POST(req) {
  const body = await req.json();

  // Only a logged-in admin may obtain an upload token.
  const cookie = req.cookies.get(SESSION_COOKIE);
  const authed = Boolean(cookie && cookie.value === getExpectedToken());

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!authed) throw new Error('Unauthorized');
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB ceiling
        };
      },
      // The client saves the returned blob URL into the collection doc itself,
      // so nothing extra to persist here.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 400 });
  }
}
