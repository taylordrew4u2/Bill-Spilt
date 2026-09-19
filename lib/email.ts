import nodemailer from "nodemailer";
import { recordEmailHealth } from "@/lib/email-health";

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

/** Which transport would be used, for operator diagnostics. */
export function emailProvider(): "resend" | "smtp" | "none" {
  if (RESEND_API_KEY) return "resend";
  if (SMTP_USER && SMTP_PASS) return "smtp";
  return "none";
}

/** Bound on each SMTP step, so a stalled mail host can't pin a lambda open. */
const SMTP_TIMEOUT_MS = 10_000;
/** Bound on a credential probe, which runs while someone waits on /forgot. */
const PROBE_TIMEOUT_MS = 8_000;

// A failed send is recorded durably — see lib/email-health.ts. An in-memory
// flag here could only ever describe the one lambda that handled the request,
// which is why a revoked app password used to read as "everything is fine".

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

/**
 * Lazily-created SMTP transport. Every step is bounded: a mail host that
 * accepts the connection and then goes quiet would otherwise hold a
 * serverless invocation open until the platform kills it.
 */
let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!SMTP_USER || !SMTP_PASS) throw new Error("SMTP is not configured");
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS * 2,
    });
  }
  return transporter;
}

async function sendViaSmtp(
  to: string,
  c: ReturnType<typeof resetContent>,
): Promise<void> {
  await getTransporter().sendMail({
    from: `"BillSpilt" <${SMTP_FROM}>`,
    to,
    subject: c.subject,
    text: c.text,
    html: c.html,
  });
}

/** Outcome of `emailProviderHealthy()`. */
export type ProviderCheck = { ok: true } | { ok: false; error: string };

/** Reject once `ms` elapse, so a probe can never hang the request it's in. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );
    p.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/** nodemailer's probe signature (optional in its typings, hence the cast). */
type Verifier = (cb: (err: Error | null, success?: boolean) => void) => void;

/**
 * Can the configured provider still authenticate?
 *
 * This is the failure that otherwise looks like nothing at all: a revoked Gmail
 * app password leaves every environment variable in place, so
 * `emailConfigured()` keeps answering yes while every send is refused with
 * `535-5.7.8 Username and Password not accepted`. Without this check `/forgot`
 * keeps telling people to check an inbox that no mail will ever reach.
 *
 * Only SMTP is probed, because its handshake is exactly what a send performs,
 * so a pass means a send would work. Resend would have to be checked with an
 * endpoint the key may not be scoped for (a send-only key cannot list domains),
 * and a false negative there would block resets that would have succeeded — so
 * Resend reports healthy here and its failures surface in /api/health instead.
 */
export async function emailProviderHealthy(): Promise<ProviderCheck> {
  // Resend wins the send, so probing SMTP would be testing the wrong door.
  if (RESEND_API_KEY || !SMTP_USER || !SMTP_PASS) return { ok: true };

  const transport = getTransporter();
  const verify = (transport as unknown as { verify?: Verifier }).verify;
  if (typeof verify !== "function") return { ok: true };

  try {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        verify.call(transport, (err) => (err ? reject(err) : resolve()));
      }),
      PROBE_TIMEOUT_MS,
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  link: string,
): Promise<void> {
  const c = resetContent(link);
  try {
    if (RESEND_API_KEY) {
      await sendViaResend(to, c);
    } else if (SMTP_USER && SMTP_PASS) {
      await sendViaSmtp(to, c);
    } else {
      throw new Error("Email is not configured");
    }
    await recordEmailHealth(true);
  } catch (e) {
    // Recorded durably so /api/health can see it from whichever instance serves
    // the next request, and so /forgot can stop promising a link is coming.
    await recordEmailHealth(false, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
