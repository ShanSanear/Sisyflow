import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProjectDocumentation } from "@/lib/hooks/useProjectDocumentation";
import { useUnsavedChangesPrompt } from "@/lib/hooks/useUnsavedChangesPrompt";
import DocumentationEditorForm from "./DocumentationEditorForm";
import { useToast } from "@/lib/hooks/useToast";

export default function DocumentationManagementView() {
  const { viewModel, saveStatus, charCountStatus, setContent, save, refetch, isDirty, isLoading, error } =
    useProjectDocumentation();
  const { showError, showSuccess } = useToast();
  const prevSaveStatusRef = useRef(saveStatus);
  const saveRef = useRef(save);

  // Update save ref when save function changes
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Ostrzeżenie o niezapisanych zmianach
  useUnsavedChangesPrompt(isDirty);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Show success/error toasts for save operations
  useEffect(() => {
    const prevStatus = prevSaveStatusRef.current;
    const currentStatus = saveStatus;

    // Detect when save operation completed
    if (prevStatus === "saving" && currentStatus === "idle" && !viewModel.api.error) {
      // Save completed successfully
      showSuccess("Project documentation updated successfully");
    } else if (prevStatus === "saving" && currentStatus === "error" && viewModel.api.error) {
      // Save failed
      showError(viewModel.api.error);
    }

    prevSaveStatusRef.current = currentStatus;
  }, [saveStatus, viewModel.api.error, showSuccess, showError]);

  // Obsługa skrótu klawiaturowego Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        // Multiple prevention methods for cross-browser compatibility
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        if (isDirty && !viewModel.api.saving) {
          saveRef.current().catch((error) => {
            console.error("Save failed:", error);
          }); // Handle any errors from save
        }

        return false;
      }
    };

    // Use capture phase for maximum control
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isDirty, viewModel.api.saving]); // Removed save from dependencies

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">An error occurred while loading project documentation.</p>
        <Button onClick={refetch} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Project Documentation</h2>
        <p className="text-muted-foreground">
          Edit the central project documentation that provides context for AI interactions.
        </p>
        {viewModel.data?.updated_at && (
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date(viewModel.data.updated_at).toLocaleString()}
            {viewModel.data.updated_by && ` by ${viewModel.data.updated_by.username}`}
          </p>
        )}
      </div>

      <DocumentationEditorForm
        value={viewModel.form.content}
        maxLength={viewModel.form.maxChars}
        charCount={viewModel.form.charCount}
        charCountStatus={charCountStatus}
        dirty={isDirty}
        status={saveStatus}
        onChange={setContent}
        onSave={() =>
          save().catch((error) => {
            console.error("Save failed:", error);
          })
        } // Catch validation errors from hook
        disabled={viewModel.api.saving}
      />
    </div>
  );
}
