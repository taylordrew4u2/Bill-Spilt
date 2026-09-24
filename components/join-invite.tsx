"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="w-full space-y-6">
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-left text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/home">Go to the app</Link>
        </Button>
      </div>
    );
  }

  return (
    // The spinner sits inline so it stays beside the first word when a long
    // household name wraps the line.
    <p role="status" className="text-center text-base text-muted-foreground">
      <Loader2
        className="mr-2 inline-block h-5 w-5 animate-spin align-[-0.2em] text-primary"
        aria-hidden
      />
      Adding you to {householdName}…
    </p>
  );
}
