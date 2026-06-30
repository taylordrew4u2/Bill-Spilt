"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/lib/use-invite";

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

    acceptInvite(code).then((result) => {
      if (result.ok) {
        router.replace("/home");
        router.refresh();
      } else {
        setError(result.error ?? "Could not join this household");
      }
    });
  }, [code, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
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
    <div
      role="status"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      Adding you to {householdName}…
    </div>
  );
}
