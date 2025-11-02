import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { SaveStatus } from "@/types";

interface SaveBarProps {
  status: SaveStatus;
  disabled: boolean;
  onSave: () => void;
}

export default function SaveBar({ status, disabled, onSave }: SaveBarProps) {
  const getButtonContent = () => {
    switch (status) {
      case "saving":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        );
      case "success":
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Saved successfully
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Save failed
          </>
        );
      case "idle":
      default:
        return "Save changes";
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "saving":
      case "idle":
      default:
        return "default";
    }
  };

  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={disabled} variant={getButtonVariant()} size="sm">
        {getButtonContent()}
      </Button>
    </div>
  );
}
