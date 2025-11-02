import { cn } from "@/lib/utils";
import { CharCountStatus } from "@/lib/hooks/useProjectDocumentation";

interface CharCounterProps {
  current: number;
  max: number;
  status: CharCountStatus;
}

export default function CharCounter({ current, max, status }: CharCounterProps) {
  const getStatusColor = (status: CharCountStatus) => {
    switch (status) {
      case CharCountStatus.Error:
        return "text-destructive";
      case CharCountStatus.Warning:
        return "text-yellow-600";
      case CharCountStatus.Normal:
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("text-sm font-medium", getStatusColor(status))}>
      {current}/{max} characters
    </div>
  );
}
