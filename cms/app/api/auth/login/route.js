import { NextResponse } from 'next/server';
import { SESSION_COOKIE, getExpectedToken } from '../../../../lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const password = body.password || '';

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server is missing ADMIN_PASSWORD' }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, getExpectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
