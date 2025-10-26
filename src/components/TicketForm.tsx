import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema, type TicketFormData } from "@/lib/validation/schemas/ticket";
import type { TicketModalMode, UserDTO, FullTicketDTO } from "@/types";
import { TitleInput } from "@/components/TitleInput";
import { DescriptionEditor } from "@/components/DescriptionEditor";
import { TypeSelect } from "@/components/TypeSelect";
import { AssigneeSection } from "@/components/AssigneeSection";
import { ReporterDisplay } from "@/components/ReporterDisplay";

interface TicketFormProps {
  formData: Partial<TicketFormData>;
  onChange: (data: Partial<TicketFormData>) => void;
  errors: Record<string, string>;
  mode: TicketModalMode;
  user: UserDTO | null;
  isAdmin: boolean;
  ticket?: FullTicketDTO;
  onAssigneeUpdate?: (assignee: { id: string; username: string } | null) => void;
}

/**
 * Formularz do wprowadzania/edycji danych ticketa
 * Używa React Hook Form z Zod resolver dla walidacji
 */
export const TicketForm: React.FC<TicketFormProps> = ({
  formData,
  onChange,
  errors,
  mode,
  user,
  isAdmin,
  ticket,
  onAssigneeUpdate,
}) => {
  const {
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: formData,
  });

  const watchedValues = watch();

  const handleFormSubmit = () => {
    // Submit jest obsługiwany przez ActionButtons
  };

  return (
    <form data-testid="ticket-modal-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <TitleInput
        value={watchedValues.title || " "}
        onChange={(value) => {
          setValue("title", value);
          onChange({ title: value });
        }}
        error={formErrors.title?.message || errors.title}
        mode={mode}
      />
      <DescriptionEditor
        value={watchedValues.description || " "}
        onChange={(value) => {
          setValue("description", value);
          onChange({ description: value });
        }}
        error={formErrors.description?.message || errors.description}
        mode={mode}
      />
      <TypeSelect
        value={watchedValues.type}
        onChange={(value) => {
          setValue("type", value);
          onChange({ type: value });
        }}
        error={formErrors.type?.message || errors.type}
        mode={mode}
      />

      {mode !== "create" && ticket && (
        <AssigneeSection
          assignee={ticket.assignee || undefined}
          currentUser={user}
          isAdmin={isAdmin}
          onAssign={onAssigneeUpdate || (() => undefined)}
          mode={mode}
          ticketId={ticket.id}
        />
      )}

      {(mode === "edit" || mode === "view") && ticket && <ReporterDisplay reporter={ticket.reporter} />}
    </form>
  );
};
