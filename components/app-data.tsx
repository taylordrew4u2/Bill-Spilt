"use client";

import * as React from "react";
import type { Member } from "@/lib/types";

interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

interface AppData {
  household: Household | null;
  members: Member[];
  currentUserId: string | null;
  /** Bumped after any mutation so tabs can re-fetch derived data. */
  version: number;
  loading: boolean;
  needsSetup: boolean;
  /** Re-fetch members/household. */
  refresh: () => Promise<void>;
  /** Signal that ledger data changed (expenses/settlements). */
  mutate: () => void;
}

const Ctx = React.createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used within <AppDataProvider>");
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [household, setHousehold] = React.useState<Household | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [needsSetup, setNeedsSetup] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.status === 404) {
        setNeedsSetup(true);
        setHousehold(null);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setNeedsSetup(false);
      setMembers(data.members ?? []);
      setHousehold(data.household ?? null);
      setCurrentUserId(data.currentUserId ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = React.useCallback(() => setVersion((v) => v + 1), []);

  return (
    <Ctx.Provider
      value={{
        household,
        members,
        currentUserId,
        version,
        loading,
        needsSetup,
        refresh,
        mutate,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
