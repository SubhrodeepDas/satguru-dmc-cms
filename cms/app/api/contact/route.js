import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
  const location = String(body.location || '').trim();
  const message = String(body.message || '').trim();

  if (!firstName || !lastName || !phone || !email || !location) {
    return NextResponse.json({ success: false, error: 'Please fill in all required fields.' }, { status: 400 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.CONTACT_TO) {
    console.error('[contact] Missing SMTP_USER / SMTP_PASS / CONTACT_TO env vars');
    return NextResponse.json({ success: false, error: 'Message could not be sent. Please try again.' }, { status: 500 });
  }

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
      replyTo: `"${firstName} ${lastName}" <${email}>`,
      subject: `Satguru DMC | Contact Enquiry from ${firstName} ${lastName}`,
      html: `
        <h2 style="color:#114349;">Satguru DMC Russia — Contact Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">First Name</td><td style="padding:8px;border:1px solid #ddd;">${esc(firstName)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Last Name</td><td style="padding:8px;border:1px solid #ddd;">${esc(lastName)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${esc(phone)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${esc(email)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Location</td><td style="padding:8px;border:1px solid #ddd;">${esc(location)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Message</td><td style="padding:8px;border:1px solid #ddd;">${esc(message).replace(/\n/g, '<br>')}</td></tr>
        </table>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] send failed:', err.message);
    return NextResponse.json({ success: false, error: 'Message could not be sent. Please try again.' }, { status: 502 });
  }
}
