import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTicketModal } from "@/lib/contexts/TicketModalContext";
import { useUser } from "@/lib/hooks/useUser";
import { TicketModalHeader } from "@/components/TicketModalHeader";
import { TicketModalContent } from "@/components/TicketModalContent";
import { useTicketModalState } from "@/lib/hooks/useTicketModalState";
import { useTicketData } from "@/lib/hooks/useTicketData";
import { useTicketPermissions } from "@/lib/hooks/useTicketPermissions";
import { useTicketActions } from "@/lib/hooks/useTicketActions";
import type { AISuggestionsResponse } from "@/types";

/**
 * Główny komponent modalny dla zarządzania ticketami
 * Obsługuje tryby create, edit i view z walidacją i integracją API
 */
export const TicketModal: React.FC = () => {
  const { isOpen, mode, ticketId, onClose, onSave, setOpen } = useTicketModal();
  const { user, isAdmin } = useUser();

  // AI session state - used in ticket save flow
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [aiRating, setAiRating] = useState<number | null>(null);

  // Reset AI session state (used when switching to edit mode)
  const handleAISessionReset = () => {
    setAiSuggestions(null);
    setAiRating(null);
  };

  // Handle AI suggestions changes
  const handleAISessionChange = (suggestions: AISuggestionsResponse | null, rating?: number | null) => {
    setAiSuggestions(suggestions);
    if (rating !== undefined) {
      setAiRating(rating);
    }
  };

  // Custom hooks dla separacji odpowiedzialności
  const { formData, errors, isFormValid, handleFormChange, resetForm } = useTicketModalState();

  const { ticket, loading } = useTicketData({
    mode,
    ticketId,
    onClose,
    onFormReset: resetForm,
  });

  const { canEditTicket } = useTicketPermissions({
    mode,
    ticket,
    user,
    isAdmin,
    setOpen,
  });

  const { handleSave, handleEditMode, onAssigneeChange } = useTicketActions({
    user,
    mode,
    ticketId,
    ticket,
    aiSuggestions,
    aiRating,
    onSave,
    onClose,
    onFormReset: resetForm,
    onAiSessionReset: handleAISessionReset,
    setOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="ticket-modal" className="w-full min-w-5xl max-h-[90vh] p-4 sm:p-6">
        <TicketModalHeader mode={mode} />

        <TicketModalContent
          formData={formData}
          errors={errors}
          isFormValid={isFormValid}
          loading={loading}
          mode={mode}
          user={user}
          isAdmin={isAdmin}
          ticket={ticket}
          canEdit={canEditTicket(ticket, user, isAdmin)}
          onFormChange={handleFormChange}
          onSave={() => handleSave(formData)}
          onEdit={handleEditMode}
          onCancel={onClose}
          onAssigneeChange={onAssigneeChange}
          onAISessionChange={handleAISessionChange}
        />
      </DialogContent>
    </Dialog>
  );
};
