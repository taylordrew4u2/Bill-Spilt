"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import {
  ChevronRight,
  Home,
  LogOut,
  Megaphone,
  UserRound,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MemberAvatar } from "@/components/member-avatar";
import { ThemeSelect } from "@/components/theme-toggle";
import { useAppData } from "@/components/app-data";
import { cn } from "@/lib/utils";

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
  destructive,
}: {
  icon: typeof Home;
  label: string;
  hint?: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent active:bg-accent",
        destructive && "text-destructive",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
          destructive ? "bg-destructive/10" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && (
          <span className="block truncate text-sm text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      {!destructive && (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}

/**
 * Everything that used to crowd the top bar as a row of unlabeled icons —
 * profile, household settings, theme, ads, log out — as one labeled list
 * behind the avatar button.
 */
export function AccountSheet({
  open,
  onOpenChange,
  onProfile,
  onHousehold,
  onAds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfile: () => void;
  onHousehold: () => void;
  onAds: () => void;
}) {
  const { members, currentUserId, household, isSiteAdmin } = useAppData();
  const me = members.find((m) => m.id === currentUserId);

  // Close this sheet first so two dialogs never stack.
  const go = (fn: () => void) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader className="mb-5">
          <div className="flex items-center gap-3">
            {me && (
              <MemberAvatar id={me.id} name={me.name} className="h-12 w-12 text-base" />
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate">{me?.name ?? "Your account"}</SheetTitle>
              <SheetDescription className="truncate">
                {me?.email ?? "Profile and settings"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="divide-y overflow-hidden rounded-2xl border">
          <Row
            icon={UserRound}
            label="Profile"
            hint="Name, email, password, ways to pay"
            onClick={go(onProfile)}
          />
          <Row
            icon={Home}
            label="Household"
            hint={household?.name ?? "Members, invite link, currency"}
            onClick={go(onHousehold)}
          />
          {isSiteAdmin && (
            <Row
              icon={Megaphone}
              label="Manage ads"
              hint="Site admin"
              onClick={go(onAds)}
            />
          )}
        </div>

        <p className="mb-2 mt-6 px-1 text-sm font-semibold text-muted-foreground">
          Appearance
        </p>
        <ThemeSelect />

        <div className="mt-6 overflow-hidden rounded-2xl border">
          <Row
            icon={LogOut}
            label="Log out"
            destructive
            onClick={() => signOut({ callbackUrl: "/login" })}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
