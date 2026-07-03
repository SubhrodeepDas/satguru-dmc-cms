import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_session';

export function middleware(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN || 'dev-only-insecure-token';
  if (token !== expected) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
