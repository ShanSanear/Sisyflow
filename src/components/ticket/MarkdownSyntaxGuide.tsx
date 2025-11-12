import React from "react";
import markdownGuideContent from "../../content/markdown-guide.md?raw";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

/**
 * Component that renders the Markdown Syntax Guide from a markdown file
 */
export const MarkdownSyntaxGuide: React.FC = () => {
  return (
    <div className="space-y-6 prose prose-sm max-w-none">
      <MarkdownRenderer>{markdownGuideContent}</MarkdownRenderer>
    </div>
  );
};
