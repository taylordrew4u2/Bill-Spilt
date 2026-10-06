import { NextResponse } from "next/server";
import { requireViewer, handle } from "@/lib/api";
import { getBalances, getMembers, getPairwiseBalances } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Balances, scoped to what the caller may see.
 *
 * The admin keeps the books, so they get every member's household-wide net
 * ("household" scope). Everyone else gets the balance between themselves and
 * each roommate ("personal" scope) — their own money, not the house's — plus
 * their own overall net for the hero card.
 */
export async function GET() {
  return handle(async () => {
    const { householdId, viewer } = await requireViewer();

    if (viewer.isAdmin) {
      const [balances, members] = await Promise.all([
        getBalances(householdId),
        getMembers(householdId),
      ]);
      const yourNet =
        balances.find((b) => b.userId === viewer.userId)?.net ?? 0;
      return NextResponse.json({
        scope: "household",
        balances,
        yourNet,
        members,
      });
    }

    const [balances, members, household] = await Promise.all([
      getPairwiseBalances(householdId, viewer.userId),
      getMembers(householdId),
      getBalances(householdId),
    ]);
    const yourNet = household.find((b) => b.userId === viewer.userId)?.net ?? 0;
    return NextResponse.json({ scope: "personal", balances, yourNet, members });
  });
}
