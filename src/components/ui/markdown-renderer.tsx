import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  children: string;
}

/**
 * Reusable Markdown renderer component with consistent styling for ticket descriptions
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children, ...props }: React.ComponentProps<"pre">) => {
          return (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-foreground font-mono text-sm" {...props}>
              {children}
            </pre>
          );
        },
        code: ({ className, children, ...props }: React.ComponentProps<"code">) => {
          const isInline = !className || className === "";
          if (isInline) {
            // Inline code needs custom styling
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            );
          }
          // Block code - let CSS handle it via .prose pre code
          return <code {...props}>{children}</code>;
        },
        del: ({ children }: React.ComponentProps<"del">) => <del className="line-through">{children}</del>,
      }}
    >
      {children}
    </Markdown>
  );
};
