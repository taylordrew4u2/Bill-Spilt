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
  /** True when the current user is the household owner (head admin). */
  isAdmin: boolean;
  /** True when the current user is a site admin (app operator / ad manager). */
  isSiteAdmin: boolean;
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
  const [isSiteAdmin, setIsSiteAdmin] = React.useState(false);

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
      setIsSiteAdmin(Boolean(data.isSiteAdmin));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = React.useCallback(() => setVersion((v) => v + 1), []);

  const isAdmin =
    !!currentUserId &&
    members.some((m) => m.id === currentUserId && m.role === "owner");

  return (
    <Ctx.Provider
      value={{
        household,
        members,
        currentUserId,
        isAdmin,
        isSiteAdmin,
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
