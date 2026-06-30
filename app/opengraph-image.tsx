import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const runtime = "nodejs";
export const alt =
  "BillSpilt — free bill splitter for roommates. Split shared bills, see who owes what, settle up.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Embed the real app icon so the social card matches the launcher/in-app brand.
const ICON_SRC = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public/icons/icon-512.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
})();

/**
 * Social share card used for every route (Next picks this up from the app
 * root). Built with inline styles and a system font so it renders without any
 * external asset fetches.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 6,
            opacity: 0.97,
          }}
        >
          {ICON_SRC ? (
            <img src={ICON_SRC} width={76} height={76} style={{ borderRadius: 18 }} alt="" />
          ) : null}
          BillSpilt
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Split bills with roommates — free forever.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            lineHeight: 1.3,
            opacity: 0.92,
            maxWidth: 900,
          }}
        >
          {SITE_DESCRIPTION.split(".")[0]}. No paywall, no credit card.
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 44,
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          {["Who owes what", "Fewest payments", "Works offline"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.15)",
                padding: "12px 22px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
