import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTicketModal } from "@/lib/contexts/TicketModalContext";
import { useUser } from "@/lib/hooks/useUser";
import type { FullTicketDTO } from "@/types";
import { TicketForm } from "@/components/TicketForm";
import { ActionButtons } from "@/components/ActionButtons";
import { ticketSchema, type TicketFormData } from "@/lib/validation/schemas/ticket";

/**
 * Główny komponent modalny dla zarządzania ticketami
 * Obsługuje tryby create, edit i view z walidacją i integracją API
 */
export const TicketModal: React.FC = () => {
  const { isOpen, mode, ticketId, onClose, onSave, setOpen } = useTicketModal();
  const { user, isAdmin } = useUser();
  const [ticket, setTicket] = useState<FullTicketDTO | undefined>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>({
    title: "",
    description: "",
    type: "TASK",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateForm = useCallback((data: TicketFormData) => {
    const result = ticketSchema.safeParse(data);
    if (result.success) {
      setErrors({});
      setIsFormValid(true);
    } else {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path.length > 0) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      setIsFormValid(false);
    }
  }, []);

  // Ładowanie danych ticketa dla trybów edit/view
  useEffect(() => {
    if (mode === "edit" || mode === "view") {
      if (!ticketId) return;

      const fetchTicket = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/tickets/${ticketId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch ticket");
          }
          const ticketData: FullTicketDTO = await response.json();
          setTicket(ticketData);
          const newFormData: TicketFormData = {
            title: ticketData.title,
            description: ticketData.description || "",
            type: ticketData.type,
          };
          setFormData(newFormData);
          validateForm(newFormData);
        } catch (error) {
          console.error("Error fetching ticket:", error);
          toast.error("Failed to load ticket");
          onClose();
        } finally {
          setLoading(false);
        }
      };

      fetchTicket();
    } else {
      // Reset dla trybu create
      setTicket(undefined);
      const newFormData: TicketFormData = {
        title: "",
        description: "",
        type: "TASK",
      };
      setFormData(newFormData);
      validateForm(newFormData);
    }
  }, [mode, ticketId, onClose, validateForm]);

  // Sprawdzenie uprawnień - jeśli nie admin i nie właściciel, przełącz na view
  useEffect(() => {
    if (mode === "edit" && ticket && user && !isAdmin && ticket.reporter.id !== user.id) {
      toast.warning("You don't have permission to edit this ticket. Switching to view mode.");
      // Switch to view mode by updating the context
      setOpen({ mode: "view", ticketId: ticket.id });
    }
  }, [mode, ticket, user, isAdmin, setOpen]);

  const handleSave = async (data: typeof formData) => {
    if (!user) return;

    setLoading(true);
    try {
      let response: Response;
      console.log("handleSave data:", data);
      console.log("HandleSave mode:", mode);
      if (mode === "create") {
        response = await fetch("/api/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else if (mode === "edit" && ticketId) {
        response = await fetch(`/api/tickets/${ticketId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        throw new Error("Invalid mode or missing ticket ID");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save ticket");
      }

      const savedTicket: FullTicketDTO = await response.json();
      onSave(savedTicket);

      // Emit custom event for components to react to ticket changes
      window.dispatchEvent(new CustomEvent("ticket:saved", { detail: savedTicket }));

      toast.success(mode === "create" ? "Ticket created" : "Ticket updated");
      onClose();
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (data: Partial<TicketFormData>) => {
    const newData = { ...formData, ...data };
    setFormData(newData);
    // Sprawdź walidację formularza
    validateForm(newData);
  };

  const handleAssigneeUpdate = (newAssignee: { id: string; username: string } | null) => {
    if (ticket) {
      setTicket({
        ...ticket,
        assignee: newAssignee || undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Create new ticket"}
            {mode === "edit" && "Edit ticket"}
            {mode === "view" && "View ticket"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Fill in the details to create a new ticket"}
            {mode === "edit" && "Make changes to the ticket details"}
            {mode === "view" && "View ticket information"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <TicketForm
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              mode={mode}
              user={user}
              isAdmin={isAdmin}
              ticket={ticket}
              onAssigneeUpdate={handleAssigneeUpdate}
            />
            <ActionButtons
              onCancel={onClose}
              onSave={() => handleSave(formData)}
              isLoading={loading}
              isValid={isFormValid}
              mode={mode}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
