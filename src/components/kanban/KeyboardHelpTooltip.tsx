import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Keyboard } from "lucide-react";

export const KeyboardHelpTooltip: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Help
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Keyboard Navigation:</p>
            <ul className="text-sm space-y-1">
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Tab
                </kbd>{" "}
                - Navigate between cards
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Space/G
                </kbd>{" "}
                - Grab ticket
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Arrow Keys
                </kbd>{" "}
                - Move to another column
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Space/D
                </kbd>{" "}
                - Put down
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Escape
                </kbd>{" "}
                - Cancel drag
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded text-xs font-mono">
                  Ctrl+Enter
                </kbd>{" "}
                - Open modal
              </li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
