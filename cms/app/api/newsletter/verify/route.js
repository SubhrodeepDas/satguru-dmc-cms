import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { readAll, writeAll } from '../../../../lib/db';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();

  if (!email || !code) {
    return NextResponse.json({ success: false, error: 'Please enter the verification code.' }, { status: 400 });
  }

  const otps = await readAll('newsletter-otps');
  const entry = otps.find((o) => o.email === email);

  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ success: false, error: 'That code has expired. Please request a new one.' }, { status: 400 });
  }
  if (entry.code !== code) {
    return NextResponse.json({ success: false, error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  // Single-use — consume the code regardless of what happens next.
  await writeAll('newsletter-otps', otps.filter((o) => o.email !== email));

  const subscribers = await readAll('newsletter-subscribers');
  if (!subscribers.some((s) => s.email === email)) {
    subscribers.push({ email, subscribedAt: new Date().toISOString() });
    await writeAll('newsletter-subscribers', subscribers);
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    try {
      await transporter.sendMail({
        from: `"Satguru DMC Russia" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Satguru Travel Russia',
        html: `
          <div style="font-family:sans-serif;font-size:14px;color:#222;line-height:1.7;">
            <p>Dear Sir/Madam,</p>
            <p>Greetings from Satguru Travel Russia!</p>
            <p>We are Satguru Travel &amp; Tours Service RUS, a leading B2B DMC in Russia with offices in Moscow, Yekaterinburg &amp; Novosibirsk.</p>
            <p>We specialize in MICE and FIT/GIT holiday packages across Russia.</p>
            <p>Our team provides 24/7 support with both fixed and tailor-made travel solutions for B2B partners.</p>
            <p>For any Russia-related travel requirements, please feel free to reach out.</p>
            <p>Best Regards<br>
            Team Satguru DMC Russia</p>
          </div>
        `,
      });
    } catch (err) {
      // The subscription itself already succeeded — a failed welcome email
      // shouldn't block that or surface as an error to the visitor.
      console.error('[newsletter] welcome email failed:', err.message);
    }

    // Send the subscriber's data to the team inbox for lead capture.
    try {
      await transporter.sendMail({
        from: `"Satguru DMC Website" <${process.env.SMTP_USER}>`,
        to: 'inbound.russia@satgurutravel.com, russia.dmc@satgurutravel.com',
        subject: `Satguru DMC | New Newsletter Subscriber — ${email}`,
        html: `
          <h2 style="color:#114349;font-family:sans-serif;">New Newsletter Subscriber</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${esc(email)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Subscribed At</td><td style="padding:8px;border:1px solid #ddd;">${esc(new Date().toISOString())}</td></tr>
          </table>
        `,
      });
    } catch (err) {
      console.error('[newsletter] team notification failed:', err.message);
    }
  }

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
