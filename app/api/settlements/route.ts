import { NextResponse } from "next/server";
import { requireViewer, handle } from "@/lib/api";
import { getSettlements } from "@/lib/queries";
import { redactSettlements } from "@/lib/visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recorded settlement history ("X paid Y $Z"). Who paid whom is shown to the
// household; the figure only to the two parties and the admin.
export async function GET() {
  return handle(async () => {
    const { householdId, viewer } = await requireViewer();
    const settlements = await getSettlements(householdId);
    return NextResponse.json({
      settlements: redactSettlements(settlements, viewer),
    });
  });
}
