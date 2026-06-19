import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserHousehold } from "@/lib/queries";
import { isSiteAdminEmail } from "@/lib/site-admin";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Resolve the authenticated user id or throw a 401. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new ApiError(401, "Not authenticated");
  return id;
}

/** Resolve the authenticated user, requiring site-admin (operator) status. */
export async function requireSiteAdmin(): Promise<{
  userId: string;
  email: string;
}> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id) throw new ApiError(401, "Not authenticated");
  if (!isSiteAdminEmail(email)) {
    throw new ApiError(403, "Only the app operator can do that");
  }
  return { userId: id, email: email as string };
}

/** Resolve the user's active household or throw. */
export async function requireHousehold(): Promise<{
  userId: string;
  householdId: string;
}> {
  const userId = await requireUserId();
  const household = await getUserHousehold(userId);
  if (!household) throw new ApiError(404, "You are not in a household yet");
  return { userId, householdId: household.id };
}

/** Wrap a route handler with uniform error handling. */
export function handle<T>(fn: () => Promise<T>) {
  return fn().catch((err) => {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[api] unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  });
}
