import type { Metadata } from "next";
import { DisplayCheck } from "./display-check";

export const metadata: Metadata = {
  title: "Display check",
  robots: { index: false, follow: false },
};

/** Shows (and reports) how this device is rendering BillSpilt. */
export default function CheckPage() {
  const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);
  return <DisplayCheck build={build} />;
}
