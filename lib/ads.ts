import { sql, ensureSchema } from "@/lib/db";
import type { Ad, AdPlacement } from "@/lib/types";
import type { AdInput } from "@/lib/validation";

function rowToAd(r: Record<string, unknown>): Ad {
  return {
    id: r.id as string,
    title: r.title as string,
    body: (r.body as string) ?? null,
    imageUrl: (r.image_url as string) ?? null,
    linkUrl: r.link_url as string,
    cta: (r.cta as string) ?? null,
    placement: r.placement as AdPlacement,
    weight: Number(r.weight),
    active: r.active as boolean,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : (r.created_at as string),
  };
}

/**
 * Pick one active ad for a placement using weighted random selection, and
 * record an impression. Returns null when there are no eligible ads.
 */
export async function serveAd(placement: AdPlacement): Promise<Ad | null> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM ads
    WHERE active = true AND (placement = ${placement} OR placement = 'all')
  `;
  if (rows.length === 0) return null;

  const ads = rows.map(rowToAd);
  const totalWeight = ads.reduce((s, a) => s + Math.max(1, a.weight), 0);
  let pick = Math.random() * totalWeight;
  let chosen = ads[0];
  for (const a of ads) {
    pick -= Math.max(1, a.weight);
    if (pick <= 0) {
      chosen = a;
      break;
    }
  }

  // Fire-and-forget impression count — swallow errors so a failed write can't
  // surface as an unhandled rejection.
  void sql`UPDATE ads SET impressions = impressions + 1 WHERE id = ${chosen.id}`.catch(
    () => {},
  );
  return chosen;
}

/** Record a click and return the destination URL, or null if not found. */
export async function recordClick(id: string): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE ads SET clicks = clicks + 1 WHERE id = ${id} RETURNING link_url
  `;
  return rows.length ? (rows[0].link_url as string) : null;
}

export async function listAds(): Promise<Ad[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM ads ORDER BY created_at DESC`;
  return rows.map(rowToAd);
}

export async function createAd(input: AdInput): Promise<string> {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO ads (title, body, image_url, link_url, cta, placement, weight, active)
    VALUES (
      ${input.title}, ${input.body || null}, ${input.imageUrl || null},
      ${input.linkUrl}, ${input.cta || null}, ${input.placement},
      ${input.weight}, ${input.active}
    )
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function updateAd(id: string, input: AdInput): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE ads SET
      title = ${input.title},
      body = ${input.body || null},
      image_url = ${input.imageUrl || null},
      link_url = ${input.linkUrl},
      cta = ${input.cta || null},
      placement = ${input.placement},
      weight = ${input.weight},
      active = ${input.active}
    WHERE id = ${id}
  `;
  return !!rowCount;
}

export async function deleteAd(id: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM ads WHERE id = ${id}`;
  return !!rowCount;
}
