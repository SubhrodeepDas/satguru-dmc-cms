import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { readAll, writeAll } from '../../../../lib/db';

// Generic email-OTP gate for the Contact and Customise Your Request forms —
// deliberately separate from the newsletter's OTP/subscriber flow (this
// isn't a subscription, just proof the visitor typed a real inbox).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[verify-email] Missing SMTP_USER / SMTP_PASS env vars');
    return NextResponse.json({ success: false, error: 'Could not send a verification code. Please try again.' }, { status: 500 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otps = (await readAll('email-verification-otps')).filter((o) => o.email !== email);
  otps.push({ email, code, expiresAt: Date.now() + CODE_TTL_MS });
  await writeAll('email-verification-otps', otps);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Satguru DMC Russia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Satguru DMC verification code',
      html: `
        <div style="font-family:sans-serif;color:#222;">
          <p style="font-size:15px;color:#114349;">Your verification code is:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a7c45;margin:12px 0;">${code}</p>
          <p style="font-size:13px;color:#888;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[verify-email] send failed:', err.message);
    return NextResponse.json({ success: false, error: 'Could not send a verification code. Please try again.' }, { status: 502 });
  }
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
