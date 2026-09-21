import { requireViewer, handle } from "@/lib/api";
import { getExpenses } from "@/lib/queries";
import { ownShare } from "@/lib/visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Download the ledger as CSV.
 *
 * The admin gets everything — every total and every person's share — because
 * that's the record the house keeps. Everyone else gets the same expenses with
 * only their own share, matching what they see in the app.
 */
export async function GET() {
  return handle(async () => {
    const { householdId, viewer } = await requireViewer();
    const expenses = await getExpenses(householdId);

    const header = viewer.isAdmin
      ? ["Date", "Description", "Category", "Amount", "Paid By", "Split Type", "Splits"]
      : ["Date", "Description", "Category", "Your Share", "Paid By", "Split Type"];
    const lines = [header.map(csvEscape).join(",")];

    for (const e of expenses) {
      const row = viewer.isAdmin
        ? [
            e.createdAt.slice(0, 10),
            e.description,
            e.category,
            (e.amount ?? 0).toFixed(2),
            e.paidByName,
            e.splitType,
            e.splits.map((s) => `${s.name}: ${s.amount.toFixed(2)}`).join("; "),
          ]
        : [
            e.createdAt.slice(0, 10),
            e.description,
            e.category,
            ownShare(e, viewer).toFixed(2),
            e.paidByName,
            e.splitType,
          ];
      lines.push(row.map(csvEscape).join(","));
    }

    const csv = lines.join("\n");
    const filename = `billspilt-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
