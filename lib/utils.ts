import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency. */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Round to cents to avoid floating point drift. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Human-friendly relative-ish date. */
export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(d);
}

/** Compact relative time, e.g. "just now", "5m", "3h", "2d", else a date. */
export function timeAgo(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/**
 * Absolute URL a roommate can tap to join, built from an invite code. Prefers
 * the configured public URL and falls back to the current origin (client-side).
 */
export function inviteUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/join/${code}`;
}

/**
 * Share an invite link via the native share sheet, falling back to copying it
 * to the clipboard. Returns how it was handled so callers can show feedback.
 */
export async function shareInvite(
  code: string,
  householdName?: string,
): Promise<"shared" | "copied" | "failed"> {
  const url = inviteUrl(code);
  const text = householdName
    ? `Join ${householdName} on BillSpilt to split our bills:`
    : "Join my household on BillSpilt to split our bills:";

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title: "BillSpilt invite", text, url });
      return "shared";
    } catch (err) {
      // User dismissed the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  // Clipboard is unavailable server-side and on insecure (HTTP) origins.
  if (!nav?.clipboard) return "failed";
  try {
    await nav.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Generate a short, human-readable invite code for a household. Uses a CSPRNG
 *  since the code gates who can join a household. */
export function generateInviteCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Deterministic colour per member id, for avatars/charts. */
export function colorForId(id: string): string {
  const palette = [
    "#2563eb",
    "#16a34a",
    "#db2777",
    "#ea580c",
    "#7c3aed",
    "#0891b2",
    "#ca8a04",
    "#dc2626",
    "#4f46e5",
    "#059669",
    "#d946ef",
    "#0d9488",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

/** Pick black or white text for legible contrast on a solid background hex. */
export function readableTextColor(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Perceived (sRGB) luminance; dark text on light backgrounds, white on dark.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1f2937" : "#ffffff";
}

/** Initials from a name for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
