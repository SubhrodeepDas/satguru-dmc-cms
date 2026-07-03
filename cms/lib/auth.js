import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'admin_session';

export function getExpectedToken() {
  return process.env.ADMIN_SESSION_TOKEN || 'dev-only-insecure-token';
}

// Call from API route handlers that mutate data. Returns a 401 response if the
// request isn't carrying a valid admin session cookie, otherwise null.
export function requireAuth(req) {
  const cookie = req.cookies.get(SESSION_COOKIE);
  if (!cookie || cookie.value !== getExpectedToken()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
