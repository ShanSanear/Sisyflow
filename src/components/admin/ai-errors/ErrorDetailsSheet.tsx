import type { AIErrorViewModel } from "@/components/views/AIErrorsView";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";

interface ErrorDetailsSheetProps {
  error: AIErrorViewModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ErrorDetailsSheet({ error, isOpen, onClose }: ErrorDetailsSheetProps) {
  const { showSuccess } = useToast();

  if (!error) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(error.details_json, null, 2));
    showSuccess("Copied to clipboard!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Error Details</SheetTitle>
          <SheetDescription>Detailed information about the AI error. Created at: {error.created_at}</SheetDescription>
        </SheetHeader>
        <div className="grow my-4 bg-gray-900 text-white p-4 rounded-md overflow-auto">
          <pre className="whitespace-pre-wrap break-all">
            <code>{JSON.stringify(error.details_json, null, 2)}</code>
          </pre>
        </div>
        <SheetFooter>
          <Button onClick={handleCopyToClipboard}>Copy JSON</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
