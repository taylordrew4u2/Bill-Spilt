import { NextResponse } from "next/server";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getPairwiseBalance, isMember } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Net balance between the current user and the given member.
// `net` > 0: they owe you. `net` < 0: you owe them.
export async function GET(
  _req: Request,
  { params }: { params: { userId: string } },
) {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();
    if (!(await isMember(householdId, params.userId))) {
      throw new ApiError(404, "That person isn't in this household");
    }
    const net =
      params.userId === userId
        ? 0
        : await getPairwiseBalance(householdId, userId, params.userId);
    return NextResponse.json({ net });
  });
}
