import { Textarea } from "@/components/ui/textarea";
import CharCounter from "./CharCounter";
import SaveBar from "./SaveBar";
import type { CharCountStatus } from "@/lib/hooks/useProjectDocumentation";
import type { SaveStatus } from "@/types";

interface DocumentationEditorFormProps {
  value: string;
  maxLength: number;
  charCount: number;
  charCountStatus: CharCountStatus;
  dirty: boolean;
  status: SaveStatus;
  onChange: (value: string) => void;
  onSave: () => void;
  disabled?: boolean;
}

export default function DocumentationEditorForm({
  value,
  maxLength,
  charCount,
  charCountStatus,
  dirty,
  status,
  onChange,
  onSave,
  disabled = false,
}: DocumentationEditorFormProps) {
  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={handleTextareaChange}
          placeholder="Enter project documentation here..."
          className="min-h-[400px] resize-y font-mono text-sm"
          disabled={disabled}
          aria-label="Project documentation content"
          data-testid="documentation-editor-textarea"
        />
        <div className="flex justify-between items-center">
          <CharCounter
            current={charCount}
            max={maxLength}
            status={charCountStatus}
            data-testid="documentation-char-counter"
          />
          <div className="text-xs text-muted-foreground" data-testid="documentation-save-hint">
            Use Ctrl+S (Cmd+S on Mac) or click Save to save changes
          </div>
        </div>
      </div>

      <SaveBar
        status={status}
        disabled={disabled || !dirty || value.trim().length === 0 || charCount > maxLength}
        onSave={handleSave}
      />
    </div>
  );
}
