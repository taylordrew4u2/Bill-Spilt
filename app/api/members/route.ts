import { NextResponse } from "next/server";
import { requireHousehold, handle } from "@/lib/api";
import { getMembers, getUserHousehold } from "@/lib/queries";
import { auth } from "@/auth";
import { isSiteAdminEmail } from "@/lib/site-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { userId, householdId } = await requireHousehold();
    const session = await auth();
    const [members, household] = await Promise.all([
      getMembers(householdId),
      getUserHousehold(userId),
    ]);
    return NextResponse.json({
      members,
      household,
      currentUserId: userId,
      isSiteAdmin: isSiteAdminEmail(session?.user?.email),
    });
  });
}
