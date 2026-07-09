import { NextResponse } from 'next/server';
import { readAll, create, parseWhere, applyWhere, applySort, qualifyUrls, dequalifyUrls, checkFeatureLimit } from '../../../lib/db';
import { getCollection } from '../../../lib/collections';
import { requireAuth } from '../../../lib/auth';

export async function GET(req, { params }) {
  const { collection } = params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const url = new URL(req.url);
  const { searchParams } = url;
  let docs = await readAll(collection);
  docs = applyWhere(docs, parseWhere(searchParams));
  docs = applySort(docs, searchParams.get('sort'));

  const totalDocs = docs.length;
  const limit = parseInt(searchParams.get('limit') || '0', 10);
  if (limit > 0) docs = docs.slice(0, limit);
  docs = qualifyUrls(docs, url.origin);

  return NextResponse.json(
    {
      docs,
      totalDocs,
      limit: limit || totalDocs,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req, { params }) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { collection } = params;
  if (!getCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const body = dequalifyUrls(await req.json(), new URL(req.url).origin);
  const limitErr = await checkFeatureLimit(collection, body, null);
  if (limitErr) return NextResponse.json({ error: limitErr }, { status: 400 });
  const doc = await create(collection, body);
  return NextResponse.json(doc, { status: 201 });
}
