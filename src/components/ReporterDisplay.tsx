import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface ReporterDisplayProps {
  reporter?: { id: string; username: string } | null;
}

/**
 * Wyświetlanie osoby zgłaszającej ticket (tylko do odczytu)
 * Reporter może być null, jeśli user został usunięty z systemu
 */
export const ReporterDisplay: React.FC<ReporterDisplayProps> = ({ reporter }) => {
  return (
    <div data-testid="ticket-modal-reporter-display" className="space-y-2">
      <Label>Reporter</Label>
      <Badge variant="outline">{reporter?.username || "Unknown (user deleted)"}</Badge>
    </div>
  );
};
