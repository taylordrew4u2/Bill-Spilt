import { describe, it, expect } from "vitest";
import {
  computeSplits,
  validateSplits,
  minimizeTransfers,
  computeBalances,
} from "@/lib/settlement";
import type { Balance, Member, SplitInput } from "@/lib/types";

const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => `u${i + 1}`);

const members = (n: number): Member[] =>
  ids(n).map((id) => ({ id, name: id, email: `${id}@x.com`, role: "member", paymentMethods: [] }));

function sum(map: Record<string, number>): number {
  return Object.values(map).reduce((s, v) => s + v, 0);
}

describe("computeSplits — equal", () => {
  it("splits evenly when divisible", () => {
    const s = computeSplits(30, "equal", ids(3).map((userId) => ({ userId })));
    expect(s).toEqual({ u1: 10, u2: 10, u3: 10 });
  });

  it("distributes remainder cents deterministically and reconciles to total", () => {
    const s = computeSplits(40, "equal", ids(3).map((userId) => ({ userId })));
    // 40 / 3 = 13.333… → 13.34, 13.33, 13.33
    expect(s).toEqual({ u1: 13.34, u2: 13.33, u3: 13.33 });
    expect(sum(s)).toBeCloseTo(40, 10);
  });

  it("handles a single participant", () => {
    expect(computeSplits(9.99, "equal", [{ userId: "u1" }])).toEqual({ u1: 9.99 });
  });

  it("always sums back to the amount for awkward values", () => {
    for (const amount of [0.01, 10.01, 99.99, 100, 0.1]) {
      for (const n of [2, 3, 4, 7]) {
        const s = computeSplits(amount, "equal", ids(n).map((userId) => ({ userId })));
        expect(sum(s)).toBeCloseTo(amount, 10);
      }
    }
  });
});

describe("computeSplits — exact & percent", () => {
  it("uses exact dollar values", () => {
    const splits: SplitInput[] = [
      { userId: "u1", value: 12.5 },
      { userId: "u2", value: 7.5 },
    ];
    expect(computeSplits(20, "exact", splits)).toEqual({ u1: 12.5, u2: 7.5 });
  });

  it("converts percentages and gives the remainder to the last person", () => {
    const splits: SplitInput[] = [
      { userId: "u1", value: 33 },
      { userId: "u2", value: 33 },
      { userId: "u3", value: 34 },
    ];
    const s = computeSplits(100, "percent", splits);
    expect(sum(s)).toBeCloseTo(100, 10);
    expect(s.u1).toBe(33);
    expect(s.u2).toBe(33);
    expect(s.u3).toBe(34);
  });
});

describe("validateSplits", () => {
  it("rejects an empty split", () => {
    expect(validateSplits(10, "equal", [])).toMatch(/at least one/i);
  });
  it("rejects a non-positive amount", () => {
    expect(validateSplits(0, "equal", [{ userId: "u1" }])).toMatch(/greater than zero/i);
  });
  it("rejects exact splits that don't add up", () => {
    expect(
      validateSplits(20, "exact", [
        { userId: "u1", value: 5 },
        { userId: "u2", value: 5 },
      ]),
    ).toMatch(/add up/i);
  });
  it("accepts exact splits that reconcile", () => {
    expect(
      validateSplits(20, "exact", [
        { userId: "u1", value: 12.34 },
        { userId: "u2", value: 7.66 },
      ]),
    ).toBeNull();
  });
  it("rejects percents that don't total 100", () => {
    expect(
      validateSplits(20, "percent", [
        { userId: "u1", value: 40 },
        { userId: "u2", value: 40 },
      ]),
    ).toMatch(/100/);
  });
});

describe("minimizeTransfers — the settle-up algorithm", () => {
  const bal = (net: Record<string, number>): Balance[] =>
    Object.entries(net).map(([userId, n]) => ({ userId, name: userId, net: n }));

  it("returns no transfers when everyone is settled", () => {
    expect(minimizeTransfers(bal({ u1: 0, u2: 0 }))).toEqual([]);
  });

  it("produces a single transfer for a simple debt", () => {
    const t = minimizeTransfers(bal({ u1: 10, u2: -10 }));
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ from: "u2", to: "u1", amount: 10 });
  });

  it("uses at most N-1 transfers and fully clears all balances", () => {
    const net = { u1: 30, u2: -5, u3: -10, u4: -15 };
    const t = minimizeTransfers(bal(net));
    expect(t.length).toBeLessThanOrEqual(3);
    // Apply transfers and confirm everyone nets to zero.
    const after = { ...net } as Record<string, number>;
    for (const x of t) {
      after[x.from] += x.amount;
      after[x.to] -= x.amount;
    }
    for (const v of Object.values(after)) expect(v).toBeCloseTo(0, 6);
  });

  it("conserves money (credits == debits)", () => {
    const net = { a: 12.5, b: 7.25, c: -19.75 };
    const t = minimizeTransfers(bal(net));
    const moved = t.reduce((s, x) => s + x.amount, 0);
    expect(moved).toBeCloseTo(19.75, 6);
  });
});

describe("computeBalances", () => {
  it("nets paid minus owed per member", () => {
    const b = computeBalances(members(2), { u1: 30 }, { u1: 15, u2: 15 });
    expect(b.find((x) => x.userId === "u1")!.net).toBe(15);
    expect(b.find((x) => x.userId === "u2")!.net).toBe(-15);
  });
});
