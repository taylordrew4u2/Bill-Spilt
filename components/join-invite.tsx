"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Auto-joins the current (logged-in) user to a household by invite code, then
 * drops them into the app. No buttons to press — landing on the invite link is
 * the whole interaction.
 */
export function JoinInvite({
  code,
  householdName,
}: {
  code: string;
  householdName: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return; // guard against StrictMode double-invoke
    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/household", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", code }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Could not join this household");
          return;
        }
        router.replace("/home");
        router.refresh();
      } catch {
        setError("Could not join this household. Check your connection.");
      }
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Link
          href="/home"
          className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-semibold hover:bg-accent"
        >
          Go to the app
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Adding you to {householdName}…
    </div>
  );
}
