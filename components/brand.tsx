import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { px: 28, text: "text-base" },
  md: { px: 36, text: "text-xl" },
  lg: { px: 48, text: "text-3xl" },
} as const;

/** The BillSpilt wordmark + app-icon badge, used on auth screens, the header,
 *  invite screens, and the footer. The badge is the real app icon so the
 *  in-product brand matches the installed/launcher icon. */
export function Brand({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { px, text } = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icons/icon-192.png"
        alt=""
        aria-hidden
        width={px}
        height={px}
        className="rounded-xl shadow-sm"
      />
      <span className={cn("font-extrabold tracking-tight", text)}>
        Bill<span className="text-primary">Spilt</span>
      </span>
    </div>
  );
}
