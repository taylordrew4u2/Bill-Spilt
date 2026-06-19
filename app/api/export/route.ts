import { requireHousehold, handle } from "@/lib/api";
import { getExpenses } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Stream all expenses as a downloadable CSV.
export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const expenses = await getExpenses(householdId);

    const header = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "Paid By",
      "Split Type",
      "Splits",
    ];
    const lines = [header.map(csvEscape).join(",")];

    for (const e of expenses) {
      const splits = e.splits
        .map((s) => `${s.name}: ${s.amount.toFixed(2)}`)
        .join("; ");
      lines.push(
        [
          e.createdAt.slice(0, 10),
          e.description,
          e.category,
          e.amount.toFixed(2),
          e.paidByName,
          e.splitType,
          splits,
        ]
          .map(csvEscape)
          .join(","),
      );
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
