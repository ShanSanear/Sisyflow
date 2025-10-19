import React, { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CreateTicketCommand, Ticket, TicketModalMode, UserDTO } from "@/types";

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title can be up to 200 characters"),
  description: z.string().max(10000, "Description can be up to 10,000 characters").optional().or(z.literal("")),
  type: z.enum(["BUG", "IMPROVEMENT", "TASK"], {
    errorMap: () => ({ message: "Select ticket type" }),
  }),
});

type TicketFormSchema = z.infer<typeof ticketSchema>;

export interface TicketFormProps {
  mode: TicketModalMode;
  formData: Partial<CreateTicketCommand>;
  onChange: (updates: Partial<CreateTicketCommand>) => void;
  onValidationChange: (errors: Record<string, string>, isValid: boolean) => void;
  assigneeId: string | null;
  assigneeUsername?: string;
  reporterUsername?: string;
  users: UserDTO[];
  onAssignChange: (assigneeId: string | null) => void;
  onSelfAssign: () => void;
  onSubmit?: () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  mode,
  formData,
  onChange,
  onValidationChange,
  assigneeId,
  assigneeUsername,
  reporterUsername,
  users,
  onAssignChange,
  onSelfAssign,
  onSubmit,
}) => {
  const defaultValues = useMemo<TicketFormSchema>(
    () => ({
      title: formData.title ?? "",
      description: formData.description ?? "",
      type: (formData.type ?? "BUG") as Ticket["type"],
    }),
    [formData]
  );

  const isViewMode = mode === "view";

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isValid },
    watch,
    setValue,
  } = useForm<TicketFormSchema>({
    defaultValues,
    resolver: zodResolver(ticketSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const values = watch();
  const descriptionValue = values.description ?? "";

  const submitHandler = handleSubmit(() => {
    if (isViewMode) {
      return;
    }

    onChange({
      title: values.title,
      description: descriptionValue,
      type: values.type,
    });

    onSubmit?.();
  });

  const currentErrors = useMemo(() => {
    const errorMap: Record<string, string> = {};

    if (formErrors.title?.message) errorMap.title = formErrors.title.message;
    if (formErrors.description?.message) errorMap.description = formErrors.description.message;
    if (formErrors.type?.message) errorMap.type = formErrors.type.message;

    return errorMap;
  }, [formErrors]);

  React.useEffect(() => {
    onValidationChange(currentErrors, isValid);
  }, [currentErrors, isValid, onValidationChange]);

  React.useEffect(() => {
    onChange({ title: values.title, description: descriptionValue, type: values.type });
  }, [values.title, descriptionValue, values.type, onChange]);

  return (
    <form id="ticket-modal-form" className="space-y-6" onSubmit={submitHandler}>
      <div className="space-y-2">
        <Label htmlFor="ticket-title" className="text-sm font-medium">
          Title
        </Label>
        <Input
          id="ticket-title"
          aria-invalid={Boolean(currentErrors.title)}
          disabled={isViewMode}
          {...register("title")}
        />
        {currentErrors.title ? <p className="text-sm text-destructive">{currentErrors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="ticket-description"
          aria-invalid={Boolean(currentErrors.description)}
          disabled={isViewMode}
          className="min-h-[160px]"
          {...register("description")}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {descriptionValue.length}/10000 characters
            {descriptionValue.length > 8000 ? " (consider shortening the description)" : ""}
          </span>
        </div>
        {currentErrors.description ? <p className="text-sm text-destructive">{currentErrors.description}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticket-type" className="text-sm font-medium">
            Ticket type
          </Label>
          <Select
            value={values.type}
            onValueChange={(value) => {
              setValue("type", value as Ticket["type"], { shouldDirty: true, shouldValidate: true });
              onChange({ type: value as Ticket["type"] });
            }}
            disabled={isViewMode}
          >
            <SelectTrigger id="ticket-type" aria-invalid={Boolean(currentErrors.type)}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUG">Bug</SelectItem>
              <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
              <SelectItem value="TASK">Task</SelectItem>
            </SelectContent>
          </Select>
          {currentErrors.type ? <p className="text-sm text-destructive">{currentErrors.type}</p> : null}
        </div>

        <div className="space-y-2">
          {mode === "create" || mode === "edit" ? (
            <Label htmlFor="ticket-assignee" className="text-sm font-medium">
              Assignee
            </Label>
          ) : (
            <span className="text-sm font-medium">Assignee</span>
          )}
          {mode === "create" || mode === "edit" ? (
            <Select
              value={assigneeId ?? ""}
              onValueChange={(value) => onAssignChange(value || null)}
              disabled={isViewMode}
            >
              <SelectTrigger id="ticket-assignee" aria-label="Select assignee">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {assigneeUsername ?? "Unassigned"}
            </div>
          )}
          {mode !== "view" ? (
            <button
              type="button"
              onClick={onSelfAssign}
              className="mt-1 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={isViewMode}
            >
              Assign to me
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium" id="reporter-label">
          Reporter
        </span>
        <div
          className={cn("rounded-md border px-3 py-2 text-sm", !reporterUsername && "text-muted-foreground")}
          role="status"
          aria-labelledby="reporter-label"
        >
          {reporterUsername ?? "Not available"}
        </div>
      </div>
    </form>
  );
};
