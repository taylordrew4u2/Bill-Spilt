import { NextResponse } from "next/server";
import { requireSiteAdmin, handle, ApiError } from "@/lib/api";
import { updateAd, deleteAd } from "@/lib/ads";
import { adSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    await requireSiteAdmin();
    const parsed = adSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid ad");
    }
    const ok = await updateAd(id, parsed.data);
    if (!ok) throw new ApiError(404, "Ad not found");
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    await requireSiteAdmin();
    const ok = await deleteAd(id);
    if (!ok) throw new ApiError(404, "Ad not found");
    return NextResponse.json({ ok: true });
  });
}
