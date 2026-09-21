import { NextResponse } from "next/server";
import { requireViewer, handle } from "@/lib/api";
import { getActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { householdId, viewer } = await requireViewer();
    const activity = await getActivity(householdId, viewer);
    return NextResponse.json({ activity });
  });
}
