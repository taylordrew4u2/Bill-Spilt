import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { getHouseholdByCode } from "@/lib/invite";
import { isMember } from "@/lib/queries";
import { JoinInvite } from "@/components/join-invite";

export const metadata = {
  title: "Join a household",
  robots: { index: false },
};

/** Full-height, centered shell shared by the invite screens. */
function JoinScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-5 text-center safe-top safe-bottom">
      <Brand size="lg" />
      {children}
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
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">This invite link isn&apos;t valid</h1>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            The code may have changed or expired. Ask your roommate for a fresh
            invite link, or start your own household.
          </p>
        </div>
        <Link
          href="/register"
          className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-95"
        >
          Get started
        </Link>
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
      <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        Joining {household.name}
      </div>
      <JoinInvite code={code} householdName={household.name} />
    </JoinScreen>
  );
}
