/**
 * Optional Vercel KV cache for settlement plans. The app is fully functional
 * without KV configured — every helper degrades gracefully to a no-op when the
 * KV environment variables are absent, so we never hard-depend on it.
 */
import type { SettlementTransfer, Balance } from "@/lib/types";

const kvEnabled = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

type Plan = { balances: Balance[]; transfers: SettlementTransfer[] };

async function getKv() {
  if (!kvEnabled) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

const key = (householdId: string) => `settlement:${householdId}`;

export async function getCachedPlan(householdId: string): Promise<Plan | null> {
  try {
    const kv = await getKv();
    if (!kv) return null;
    return (await kv.get<Plan>(key(householdId))) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedPlan(
  householdId: string,
  plan: Plan,
): Promise<void> {
  try {
    const kv = await getKv();
    if (!kv) return;
    // Short TTL — invalidated explicitly on writes, this is just a safety net.
    await kv.set(key(householdId), plan, { ex: 60 * 10 });
  } catch {
    /* cache is best-effort */
  }
}

export async function invalidatePlan(householdId: string): Promise<void> {
  try {
    const kv = await getKv();
    if (!kv) return;
    await kv.del(key(householdId));
  } catch {
    /* ignore */
  }
}
