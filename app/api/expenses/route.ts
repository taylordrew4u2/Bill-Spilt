import { NextResponse } from "next/server";
import { requireHousehold, handle, ApiError } from "@/lib/api";
import { getExpenses, isMember } from "@/lib/queries";
import { createExpense } from "@/lib/expenses";
import { expenseSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const { householdId } = await requireHousehold();
    const expenses = await getExpenses(householdId);
    return NextResponse.json({ expenses });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const { userId, householdId, currency } = await requireHousehold();
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0]?.message ?? "Invalid expense");
    }
    const data = parsed.data;

    // Guard: payer and everyone in the split must belong to the household.
    const participants = new Set([data.paidBy, ...data.splits.map((s) => s.userId)]);
    for (const id of participants) {
      if (!(await isMember(householdId, id))) {
        throw new ApiError(403, "All participants must be household members");
      }
    }
    const id = await createExpense({
      householdId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      splitType: data.splitType,
      paidBy: data.paidBy,
      createdBy: userId,
      splits: data.splits,
      receiptUrl: data.receiptUrl ?? null,
      createdAt: data.createdAt,
    });

    await logActivity(
      householdId,
      userId,
      "expense_added",
      `Added “${data.description}” (${formatCurrency(data.amount, currency)})`,
    );
    return NextResponse.json({ id }, { status: 201 });
  });
}
