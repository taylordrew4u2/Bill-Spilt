import { describe, it, expect } from "vitest";
import {
  canSeeExpenseTotal,
  canSettle,
  ownShare,
  redactExpenses,
  redactPendingCharges,
  redactRecurringBills,
  redactSettlements,
  redactTransfers,
  stripLegacyMoney,
  type Viewer,
} from "@/lib/visibility";
import type {
  Expense,
  PendingRecurringCharge,
  RecurringBill,
  SettlementRecord,
  SettlementTransfer,
} from "@/lib/types";

const admin: Viewer = { userId: "u1", isAdmin: true };
const alice: Viewer = { userId: "u2", isAdmin: false };
const bob: Viewer = { userId: "u3", isAdmin: false };

function expense(over: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    householdId: "h1",
    description: "Groceries",
    amount: 60,
    category: "groceries",
    splitType: "equal",
    paidBy: "u1",
    paidByName: "Owner",
    createdBy: "u1",
    receiptUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    splits: [
      { userId: "u1", name: "Owner", amount: 20 },
      { userId: "u2", name: "Alice", amount: 20 },
      { userId: "u3", name: "Bob", amount: 20 },
    ],
    ...over,
  };
}

describe("expense visibility", () => {
  it("keeps every figure for the household admin", () => {
    const [e] = redactExpenses([expense()], admin);
    expect(e.amount).toBe(60);
    expect(e.splits).toHaveLength(3);
  });

  it("hides the total and other people's shares from a member", () => {
    const [e] = redactExpenses([expense()], alice);
    expect(e.amount).toBeNull();
    expect(e.splits).toEqual([{ userId: "u2", name: "Alice", amount: 20 }]);
  });

  it("keeps the total for the person who paid, and for whoever logged it", () => {
    expect(canSeeExpenseTotal(expense({ paidBy: "u2" }), alice)).toBe(true);
    expect(canSeeExpenseTotal(expense({ createdBy: "u2" }), alice)).toBe(true);
    expect(canSeeExpenseTotal(expense(), alice)).toBe(false);
  });

  it("leaves nothing behind for someone outside the split", () => {
    const [e] = redactExpenses(
      [expense({ splits: [{ userId: "u2", name: "Alice", amount: 60 }] })],
      bob,
    );
    expect(e.amount).toBeNull();
    expect(e.splits).toEqual([]);
    expect(ownShare(e, bob)).toBe(0);
  });
});

describe("settlement visibility", () => {
  const transfers: SettlementTransfer[] = [
    { from: "u2", fromName: "Alice", to: "u1", toName: "Owner", amount: 25 },
    { from: "u3", fromName: "Bob", to: "u1", toName: "Owner", amount: 40 },
  ];

  it("shows a transfer's figure only to its two parties", () => {
    const seen = redactTransfers(transfers, alice);
    expect(seen[0].amount).toBe(25);
    expect(seen[1].amount).toBeNull();
    // Who owes whom stays visible — that's the point of the ledger.
    expect(seen[1].fromName).toBe("Bob");
  });

  it("shows every figure to the admin", () => {
    expect(redactTransfers(transfers, admin).map((t) => t.amount)).toEqual([
      25, 40,
    ]);
  });

  it("applies the same rule to recorded payments", () => {
    const history: SettlementRecord[] = [
      {
        id: "s1",
        from: "u3",
        fromName: "Bob",
        to: "u1",
        toName: "Owner",
        amount: 40,
        settledAt: "2026-01-02T00:00:00.000Z",
      },
    ];
    expect(redactSettlements(history, alice)[0].amount).toBeNull();
    expect(redactSettlements(history, bob)[0].amount).toBe(40);
  });

  it("lets only the parties and the admin record or undo a payment", () => {
    const pair = { from: "u2", to: "u1" };
    expect(canSettle(pair, alice)).toBe(true);
    expect(canSettle(pair, admin)).toBe(true);
    expect(canSettle(pair, bob)).toBe(false);
  });
});

describe("recurring bill visibility", () => {
  const bill: RecurringBill = {
    id: "r1",
    householdId: "h1",
    description: "Internet",
    amountType: "fixed",
    amount: 80,
    category: "utilities",
    splitType: "equal",
    paidBy: "u1",
    paidByName: "Owner",
    frequency: "monthly",
    nextRun: "2026-02-01",
    active: true,
  };
  const charge: PendingRecurringCharge = {
    id: "c1",
    recurringId: "r1",
    description: "Electric",
    category: "utilities",
    splitType: "equal",
    paidBy: "u1",
    paidByName: "Owner",
    frequency: "monthly",
    estimatedAmount: 120,
    dueDate: "2026-02-01",
  };

  it("hides what a bill costs from members but keeps the bill itself", () => {
    const [b] = redactRecurringBills([bill], alice);
    expect(b.amount).toBeNull();
    expect(b.description).toBe("Internet");
    expect(redactRecurringBills([bill], admin)[0].amount).toBe(80);
  });

  it("hides the pre-fill hint on a due variable bill", () => {
    expect(redactPendingCharges([charge], alice)[0].estimatedAmount).toBeNull();
    expect(redactPendingCharges([charge], admin)[0].estimatedAmount).toBe(120);
  });
});

describe("stripLegacyMoney", () => {
  it("drops money that old activity rows baked into the text", () => {
    expect(stripLegacyMoney("Added “Pizza” ($40.00)")).toBe("Added “Pizza”");
    expect(stripLegacyMoney("Recorded a $12.50 payment")).toBe(
      "Recorded a payment",
    );
    expect(stripLegacyMoney("Added recurring bill “Wifi” (€60.00/mo)")).toBe(
      "Added recurring bill “Wifi”",
    );
  });

  it("leaves text that only looks numeric alone", () => {
    expect(stripLegacyMoney("Settled everyone up (3 payments)")).toBe(
      "Settled everyone up (3 payments)",
    );
    expect(stripLegacyMoney("Added “Room 2 blinds”")).toBe(
      "Added “Room 2 blinds”",
    );
    expect(stripLegacyMoney(null)).toBeNull();
  });
});
