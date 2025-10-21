import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTicketModal } from "@/lib/contexts/TicketModalContext";
import { useUser } from "@/lib/hooks/useUser";
import type { FullTicketDTO } from "@/types";
import { TicketForm } from "@/components/TicketForm";
import { ActionButtons } from "@/components/ActionButtons";

/**
 * Główny komponent modalny dla zarządzania ticketami
 * Obsługuje tryby create, edit i view z walidacją i integracją API
 */
export const TicketModal: React.FC = () => {
  const { isOpen, mode, ticketId, onClose, onSave } = useTicketModal();
  const { user, isAdmin } = useUser();
  const [ticket, setTicket] = useState<FullTicketDTO | undefined>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK" as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          setFormData({
            title: ticketData.title,
            description: ticketData.description || "",
            type: ticketData.type,
          });
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
      setFormData({
        title: "",
        description: "",
        type: "TASK",
      });
      setErrors({});
    }
  }, [mode, ticketId, onClose]);

  // Sprawdzenie uprawnień - jeśli nie admin i nie właściciel, przełącz na view
  useEffect(() => {
    if (mode === "edit" && ticket && user && !isAdmin && ticket.reporter.id !== user.id) {
      toast.warning("You don't have permission to edit this ticket");
      // Can switch to view mode here, but leaving as is for now
    }
  }, [mode, ticket, user, isAdmin]);

  const handleSave = async (data: typeof formData) => {
    if (!user) return;

    setLoading(true);
    try {
      let response: Response;

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
      toast.success(mode === "create" ? "Ticket created" : "Ticket updated");
      onClose();
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Wyczyść błędy przy zmianie
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Create new ticket"}
            {mode === "edit" && "Edit ticket"}
            {mode === "view" && "View ticket"}
          </DialogTitle>
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
            />
            <ActionButtons onCancel={onClose} onSave={() => handleSave(formData)} isLoading={loading} mode={mode} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
