import { NextResponse } from "next/server";
import { requireUserId, requireSiteAdmin, handle, ApiError } from "@/lib/api";
import { serveAd, listAds, createAd } from "@/lib/ads";
import { adSchema } from "@/lib/validation";
import type { AdPlacement } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLACEMENTS = ["all", "home", "expenses", "settle", "stats"];

// GET /api/ads?placement=home  → serve one ad (any signed-in user)
// GET /api/ads?all=1           → list all ads with stats (site admin)
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("all") === "1") {
      await requireSiteAdmin();
      const ads = await listAds();
      return NextResponse.json({ ads });
    }

    await requireUserId();
    const placementParam = searchParams.get("placement") ?? "all";
    const placement = (
      PLACEMENTS.includes(placementParam) ? placementParam : "all"
    ) as AdPlacement;
    const ad = await serveAd(placement);
    return NextResponse.json({ ad });
  });
}

// Create an ad (site admin only).
export async function POST(req: Request) {
  return handle(async () => {
    await requireSiteAdmin();
    const parsed = adSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid ad");
    }
    const id = await createAd(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  });
}
