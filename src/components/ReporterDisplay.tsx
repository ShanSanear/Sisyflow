import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface ReporterDisplayProps {
  reporter: { id: string; username: string };
}

/**
 * Wyświetlanie osoby zgłaszającej ticket (tylko do odczytu)
 */
export const ReporterDisplay: React.FC<ReporterDisplayProps> = ({ reporter }) => {
  return (
    <div data-testid="ticket-modal-reporter-display" className="space-y-2">
      <Label>Reporter</Label>
      <Badge variant="outline">{reporter.username}</Badge>
    </div>
  );
};
