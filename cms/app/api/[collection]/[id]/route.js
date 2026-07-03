import { NextResponse } from 'next/server';
import { getById, update, remove, qualifyUrls, dequalifyUrls } from '../../../../lib/db';
import { getCollection } from '../../../../lib/collections';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req, { params }) {
  const { collection, id } = params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const doc = await getById(collection, id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(qualifyUrls(doc, new URL(req.url).origin), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req, { params }) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { collection, id } = params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const body = dequalifyUrls(await req.json(), new URL(req.url).origin);
  const doc = await update(collection, id, body);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(req, { params }) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { collection, id } = params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const ok = await remove(collection, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
