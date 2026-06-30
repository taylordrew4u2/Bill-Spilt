import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorForId, initials, readableTextColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MemberAvatar({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const bg = colorForId(id);
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      <AvatarFallback style={{ backgroundColor: bg, color: readableTextColor(bg) }}>
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
