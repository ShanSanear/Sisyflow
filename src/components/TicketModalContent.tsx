import React from "react";
import type { FullTicketDTO, UserDTO, TicketModalMode } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";
import { TicketForm } from "@/components/TicketForm";
import { ActionButtons } from "@/components/ActionButtons";

interface TicketModalContentProps {
  formData: TicketFormData;
  errors: Record<string, string>;
  isFormValid: boolean;
  loading: boolean;
  mode: TicketModalMode;
  user: UserDTO | null;
  isAdmin: boolean;
  ticket?: FullTicketDTO;
  canEdit: boolean;
  onFormChange: (data: Partial<TicketFormData>) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onAssigneeChange?: () => void;
}

export const TicketModalContent: React.FC<TicketModalContentProps> = ({
  formData,
  errors,
  isFormValid,
  loading,
  mode,
  user,
  isAdmin,
  ticket,
  canEdit,
  onFormChange,
  onSave,
  onEdit,
  onCancel,
  onAssigneeChange,
}) => {
  if (loading) {
    return (
      <div data-testid="ticket-modal-loading" className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="ticket-modal-content">
      <TicketForm
        formData={formData}
        onChange={onFormChange}
        errors={errors}
        mode={mode}
        user={user}
        isAdmin={isAdmin}
        ticket={ticket}
        onAssigneeChange={onAssigneeChange}
      />
      <ActionButtons
        data-testid="ticket-modal-action-buttons"
        onCancel={onCancel}
        onSave={onSave}
        onEdit={onEdit}
        isLoading={loading}
        isValid={isFormValid}
        mode={mode}
        canEdit={canEdit}
      />
    </div>
  );
};
