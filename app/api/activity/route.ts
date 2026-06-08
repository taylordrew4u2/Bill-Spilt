import { NextResponse } from "next/server";
import { requireHousehold, handle } from "@/lib/api";
import { getActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const activity = await getActivity(householdId);
    return NextResponse.json({ activity });
  });
}
