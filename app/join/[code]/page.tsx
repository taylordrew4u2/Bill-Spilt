import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2Off, Users } from "lucide-react";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { getHouseholdByCode } from "@/lib/invite";
import { isMember } from "@/lib/queries";
import { JoinInvite } from "@/components/join-invite";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Join a household",
  robots: { index: false },
};

/** Full-height shell shared by the invite screens: brand on top, the status
 *  centered in the space below. */
function JoinScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background safe-top safe-bottom">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-gutter sm:mt-6 sm:justify-center">
        <Link
          href="/"
          aria-label="BillSpilt home"
          className="-ml-1 flex h-11 items-center rounded-xl px-1 sm:ml-0"
        >
          <Brand size="md" />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-gutter pb-20 pt-6 text-center">
        {children}
      </main>
    </div>
  );
}

/**
 * Invite entry point. A roommate taps a shared link and lands here. We collapse
 * the whole old join flow (sign up → pick the "Join" tab → type the code →
 * submit) into at most an account-creation step:
 *
 *   - Already a member        → straight into the app.
 *   - Logged in, not a member → auto-joined here, then into the app.
 *   - Logged out              → sent to sign-up pre-bound to this household,
 *                               and joined automatically once the account exists.
 *   - Bad/expired code        → a friendly dead-end, not a confusing detour.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).trim().toUpperCase();

  const household = await getHouseholdByCode(code);
  if (!household) {
    return (
      <JoinScreen>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Link2Off className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          This invite link isn&apos;t valid
        </h1>
        <p className="mt-2 max-w-sm text-base text-muted-foreground">
          The code may have changed or expired. Ask your roommate for a fresh
          invite link, or start your own household.
        </p>
        <div className="mt-8 w-full space-y-3">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full",
            )}
          >
            Log in
          </Link>
        </div>
      </JoinScreen>
    );
  }

  const session = await auth();

  // Logged out → sign up pre-bound to this household; we join right after the
  // account is created. The code/name ride along in the URL (codes aren't
  // secret — they're shown in big type inside the app).
  if (!session?.user?.id) {
    const qs = new URLSearchParams({ invite: code, house: household.name });
    redirect(`/register?${qs.toString()}`);
  }

  // Already in this household → nothing to do.
  if (await isMember(household.id, session.user.id)) {
    redirect("/home");
  }

  // Logged in but not a member → join automatically, no further taps.
  return (
    <JoinScreen>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Users className="h-8 w-8" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">
        You&apos;re joining
      </p>
      <h1 className="mt-1 max-w-full text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">
        {household.name}
      </h1>
      <div className="mt-6 w-full">
        <JoinInvite code={code} householdName={household.name} />
      </div>
    </JoinScreen>
  );
}
