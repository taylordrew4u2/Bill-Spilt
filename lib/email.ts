import nodemailer from "nodemailer";

/**
 * Password-reset email. Two zero-cost paths, in priority order:
 *
 *  1. Resend (RESEND_API_KEY) — simple HTTPS API, no SMTP/app-password hassle.
 *     Free tier covers 3,000 emails/month. Set RESEND_FROM to an address on a
 *     domain you've verified in Resend (e.g. noreply@billspilt.com).
 *  2. SMTP (SMTP_USER + SMTP_PASS) via nodemailer — e.g. a Gmail App Password.
 */

// --- Resend (preferred) ---
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM || "BillSpilt <onboarding@resend.dev>";

// --- SMTP (fallback) ---
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
// Gmail App Passwords are shown with display spaces but contain none — strip.
const SMTP_PASS = process.env.SMTP_PASS
  ? process.env.SMTP_PASS.replace(/\s+/g, "")
  : undefined;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY) || Boolean(SMTP_USER && SMTP_PASS);
}

function resetContent(link: string) {
  return {
    subject: "Reset your BillSpilt password",
    text:
      `You requested a password reset for BillSpilt.\n\n` +
      `Reset it here (link expires in 1 hour):\n${link}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#475569;margin:0 0 20px">
          You requested a password reset for <strong>BillSpilt</strong>.
        </p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;
          text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Reset password
        </a>
        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0">
          This link expires in 1 hour. If you didn't request it, ignore this email.
        </p>
      </div>`,
  };
}

async function sendViaResend(
  to: string,
  c: ReturnType<typeof resetContent>,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject: c.subject,
      text: c.text,
      html: c.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

let transporter: nodemailer.Transporter | null = null;
async function sendViaSmtp(
  to: string,
  c: ReturnType<typeof resetContent>,
): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) throw new Error("SMTP is not configured");
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  await transporter.sendMail({
    from: `"BillSpilt" <${SMTP_FROM}>`,
    to,
    subject: c.subject,
    text: c.text,
    html: c.html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  link: string,
): Promise<void> {
  const c = resetContent(link);
  if (RESEND_API_KEY) return sendViaResend(to, c);
  if (SMTP_USER && SMTP_PASS) return sendViaSmtp(to, c);
  throw new Error("Email is not configured");
}
