import nodemailer from "nodemailer";

/**
 * Email sending via SMTP (e.g. Gmail). Configure with env vars:
 *   SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465),
 *   SMTP_USER, SMTP_PASS (a Gmail App Password), SMTP_FROM (default SMTP_USER).
 * Zero-cost — uses your own mailbox.
 */
const HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || USER;

export function emailConfigured(): boolean {
  return Boolean(USER && PASS);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (!emailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465,
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(
  to: string,
  link: string,
): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("Email is not configured");

  await t.sendMail({
    from: `"BILL SPILT" <${FROM}>`,
    to,
    subject: "Reset your BILL SPILT password",
    text:
      `You requested a password reset for BILL SPILT.\n\n` +
      `Reset it here (link expires in 1 hour):\n${link}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#475569;margin:0 0 20px">
          You requested a password reset for <strong>BILL SPILT</strong>.
        </p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;
          text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Reset password
        </a>
        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0">
          This link expires in 1 hour. If you didn't request it, ignore this email.
        </p>
      </div>`,
  });
}
