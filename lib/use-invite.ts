"use client";

import * as React from "react";

export interface Invite {
  /** Household invite code carried by the link. */
  code: string;
  /** Household display name, for friendly copy (may be empty). */
  householdName: string;
}

/**
 * Reads an invite (`?invite=CODE&house=Name`) off the current URL so the
 * sign-up / log-in screens can pre-bind to a household and auto-join after
 * auth. Centralised here so both screens stay in sync.
 */
export function useInvite(): {
  invite: Invite | null;
  /** Append the active invite (if any) to an internal path — used for the
   *  "log in" / "create account" cross-links so the invite survives the hop. */
  withInvite: (path: string) => string;
} {
  const [invite, setInvite] = React.useState<Invite | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) setInvite({ code, householdName: params.get("house") ?? "" });
  }, []);

  const withInvite = React.useCallback(
    (path: string) => {
      if (!invite) return path;
      const qs = new URLSearchParams({
        invite: invite.code,
        house: invite.householdName,
      });
      return `${path}?${qs.toString()}`;
    },
    [invite],
  );

  return { invite, withInvite };
}

/**
 * Adds the current user to a household by invite code (client side). Shared by
 * the invite link and the post-auth join on sign-up / log-in.
 */
export async function acceptInvite(
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || "Could not join this household" };
  } catch {
    return {
      ok: false,
      error: "Could not join this household. Check your connection.",
    };
  }
}
