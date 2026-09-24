import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { px: 28, text: "text-base", radius: "rounded-[8px]" },
  md: { px: 36, text: "text-xl", radius: "rounded-[10px]" },
  lg: { px: 48, text: "text-3xl", radius: "rounded-xl" },
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
  const { px, text, radius } = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icons/icon-192.png"
        alt=""
        aria-hidden
        width={px}
        height={px}
        className={cn("flex-shrink-0 shadow-sm", radius)}
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
