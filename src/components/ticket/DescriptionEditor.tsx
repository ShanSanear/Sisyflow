import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Edit, HelpCircle } from "lucide-react";
import type { TicketModalMode } from "@/types";
import { MarkdownSyntaxGuide } from "./MarkdownSyntaxGuide";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mode: TicketModalMode;
}

/**
 * Enhanced editor for ticket description with Markdown preview support
 */
export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, error, mode }) => {
  // In view mode, always show preview. In create/edit modes, allow toggling
  const [showPreview, setShowPreview] = useState(mode === "view");
  const isDisabled = mode === "view";
  const charCount = value.length;
  const maxChars = 10000;
  const isNearLimit = charCount > 8000;

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Update preview state when mode changes
  useEffect(() => {
    if (mode === "view") {
      setShowPreview(true);
    }
  }, [mode]);

  return (
    <div data-testid="ticket-modal-description-editor" className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="description">Description</Label>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                aria-label="Markdown help"
                data-testid="markdown-help-button"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Markdown Syntax Guide</DialogTitle>
                <DialogDescription>Supported markdown elements and how to use them</DialogDescription>
              </DialogHeader>
              <MarkdownSyntaxGuide />
            </DialogContent>
          </Dialog>
          {!isDisabled && (
            <Button type="button" variant="ghost" size="sm" onClick={togglePreview} className="h-8 px-2">
              {showPreview ? (
                <>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        mode === "view" ? (
          // View mode: show only markdown preview
          <div className="prose prose-sm max-w-none max-h-96 overflow-auto p-3 border rounded-md bg-muted/30">
            <MarkdownRenderer>{value || "*No content*"}</MarkdownRenderer>
          </div>
        ) : (
          // Create/Edit mode: show split view with editor and preview
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Editor</Label>
              <Textarea
                data-testid="ticket-modal-description-editor-textarea"
                id="description"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
                className={error ? "border-destructive" : ""}
                placeholder="Describe the ticket..."
                rows={6}
                aria-describedby={error ? "description-error description-help" : "description-help"}
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="prose prose-sm max-h-96 overflow-auto p-3 border rounded-md bg-muted/30">
                <MarkdownRenderer>{value || "*No content to preview*"}</MarkdownRenderer>
              </div>
            </div>
          </div>
        )
      ) : (
        <Textarea
          data-testid="ticket-modal-description-editor-textarea"
          id="description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className={error ? "border-destructive" : ""}
          placeholder="Describe the ticket..."
          rows={6}
          aria-describedby={error ? "description-error description-help" : "description-help"}
          aria-invalid={!!error}
        />
      )}

      {!isDisabled && (
        <div
          data-testid="ticket-modal-description-editor-help"
          id="description-help"
          className="flex justify-between text-sm text-muted-foreground"
        >
          <span className={isNearLimit ? "text-warning" : ""}>
            {charCount}/{maxChars} characters
          </span>
          {isNearLimit && <span className="text-warning">Approaching character limit</span>}
        </div>
      )}
      {error && (
        <p
          data-testid="ticket-modal-description-editor-error"
          id="description-error"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
};
