import { NextResponse } from 'next/server';
import { readAll, writeAll } from '../../../../lib/db';

// How long a confirmed verification stays valid — long enough to finish
// filling out the rest of a multi-field form before hitting submit.
const VERIFIED_TTL_MS = 30 * 60 * 1000;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();

  if (!email || !code) {
    return NextResponse.json({ success: false, error: 'Please enter the verification code.' }, { status: 400 });
  }

  const otps = await readAll('email-verification-otps');
  const entry = otps.find((o) => o.email === email);

  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ success: false, error: 'That code has expired. Please request a new one.' }, { status: 400 });
  }
  if (entry.code !== code) {
    return NextResponse.json({ success: false, error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  // Single-use — consume the code regardless of what happens next.
  await writeAll('email-verification-otps', otps.filter((o) => o.email !== email));

  const verified = (await readAll('email-verifications')).filter((v) => v.email !== email);
  verified.push({ email, expiresAt: Date.now() + VERIFIED_TTL_MS });
  await writeAll('email-verifications', verified);

  return NextResponse.json({ success: true });
}

// Preflight for cross-origin POST from the static site (different origin/port).
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
