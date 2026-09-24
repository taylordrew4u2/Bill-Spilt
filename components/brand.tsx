import Image from "next/image";
import { cn } from "@/lib/utils";

// `box` sets the rendered size in rem so the badge scales with the rest of
// the UI (see lib/viewport-fix.ts); `px` is only the intrinsic image size.
const SIZES = {
  sm: { px: 28, box: "h-7 w-7", text: "text-base", radius: "rounded-[0.5rem]" },
  md: { px: 36, box: "h-9 w-9", text: "text-xl", radius: "rounded-[0.625rem]" },
  lg: { px: 48, box: "h-12 w-12", text: "text-3xl", radius: "rounded-xl" },
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
  const { px, box, text, radius } = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icons/icon-192.png"
        alt=""
        aria-hidden
        width={px}
        height={px}
        className={cn("flex-shrink-0 shadow-sm", box, radius)}
      />
      <span
        className={cn(
          "whitespace-nowrap font-extrabold leading-none tracking-tight",
          text,
        )}
      >
        Bill<span className="text-primary">Spilt</span>
      </span>
    </div>
  );
}
