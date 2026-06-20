import { cn } from "@/lib/utils";

/** The BILL SPILT wordmark + "B" badge, used on auth screens and the header. */
export function Brand({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const badge =
    size === "lg" ? "h-12 w-12 text-2xl" : size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg";
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary font-extrabold text-primary-foreground shadow-sm",
          badge,
        )}
        aria-hidden
      >
        B
      </div>
      <span className={cn("font-extrabold tracking-tight", text)}>
        BILL <span className="text-primary">SPILT</span>
      </span>
    </div>
  );
}
