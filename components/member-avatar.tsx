import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorForId, initials } from "@/lib/utils";
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
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      <AvatarFallback style={{ backgroundColor: colorForId(id) }}>
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
