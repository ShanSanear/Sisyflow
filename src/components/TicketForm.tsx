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
}

/**
 * Formularz do wprowadzania/edycji danych ticketa
 * Używa React Hook Form z Zod resolver dla walidacji
 */
export const TicketForm: React.FC<TicketFormProps> = ({ formData, onChange, errors, mode, user, isAdmin, ticket }) => {
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: formData,
  });

  const watchedValues = watch();

  // Aktualizuj formData przy zmianach
  React.useEffect(() => {
    onChange(watchedValues);
  }, [watchedValues, onChange]);

  const handleFormSubmit = () => {
    // Submit jest obsługiwany przez ActionButtons
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <TitleInput
        value={watchedValues.title || ""}
        onChange={(value) => setValue("title", value)}
        error={formErrors.title?.message || errors.title}
        mode={mode}
        {...register("title")}
      />

      <DescriptionEditor
        value={watchedValues.description || ""}
        onChange={(value) => setValue("description", value)}
        error={formErrors.description?.message || errors.description}
        mode={mode}
      />

      <TypeSelect
        value={watchedValues.type}
        onChange={(value) => setValue("type", value)}
        error={formErrors.type?.message || errors.type}
        mode={mode}
      />

      <AssigneeSection
        assignee={ticket?.assignee}
        currentUser={user}
        isAdmin={isAdmin}
        onAssign={(assigneeId) => {
          // TODO: Implement assign logic
          console.log("Assign to:", assigneeId);
        }}
        mode={mode}
        ticketId={ticket?.id}
      />

      {(mode === "edit" || mode === "view") && ticket && <ReporterDisplay reporter={ticket.reporter} />}
    </form>
  );
};
