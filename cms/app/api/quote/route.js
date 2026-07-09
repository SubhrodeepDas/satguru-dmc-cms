import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { isEmailVerified } from '../../../lib/db';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Reject header-injection attempts (CRLF) in fields that end up in email headers.
function sanitizeHeaderValue(s) {
  return String(s).replace(/[\r\n]+/g, ' ').trim();
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const firstName = sanitizeHeaderValue(body.first_name || '');
  const lastName = sanitizeHeaderValue(body.last_name || '');
  const phone = String(body.phone || '').trim();
  const email = sanitizeHeaderValue(body.email || '');
  const country = String(body.country || '').trim();
  const region = String(body.region || '').trim();
  const dateFrom = String(body.date_from || '').trim();
  const dateTo = String(body.date_to || '').trim();
  const adults = String(body.adults || '').trim();
  const children = String(body.children || '').trim();
  const holidayPref = String(body.holiday_pref || '').trim();
  const comments = String(body.comments || '').trim();

  if (!firstName || !lastName || !phone || !email || !country) {
    return NextResponse.json({ success: false, error: 'Please fill in all required fields.' }, { status: 400 });
  }

  if (!(await isEmailVerified(email))) {
    return NextResponse.json({ success: false, error: 'Please verify your email address before submitting.' }, { status: 400 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.CONTACT_TO) {
    console.error('[quote] Missing SMTP_USER / SMTP_PASS / CONTACT_TO env vars');
    return NextResponse.json({ success: false, error: 'Request could not be sent. Please try again.' }, { status: 500 });
  }

  const row = (label, value) =>
    `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${label}</td><td style="padding:8px;border:1px solid #ddd;">${esc(value || '—')}</td></tr>`;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Satguru DMC Russia" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO,
      cc: process.env.CONTACT_CC || undefined,
      replyTo: `"${firstName} ${lastName}" <${email}>`,
      subject: `Satguru DMC | Customise Request from ${firstName} ${lastName}`,
      html: `
        <h2 style="color:#114349;">Satguru DMC Russia — Customise Your Request</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          ${row('First Name', firstName)}
          ${row('Last Name', lastName)}
          ${row('Phone', phone)}
          ${row('Email', email)}
          ${row('Country', country)}
          ${row('Region to Visit', region)}
          ${row('From', dateFrom)}
          ${row('To', dateTo)}
          ${row('Adults', adults)}
          ${row('Children', children)}
          ${row('Holiday Preferences', holidayPref)}
          ${row('Comments', comments.replace(/\n/g, '<br>'))}
        </table>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[quote] send failed:', err.message);
    return NextResponse.json({ success: false, error: 'Request could not be sent. Please try again.' }, { status: 502 });
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
