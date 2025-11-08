import { useCallback, useState } from "react";
import { ticketSchema, type TicketFormData } from "@/lib/validation/schemas/ticket";

export const useTicketModalState = (initialData?: Partial<TicketFormData>) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: initialData?.type || "TASK",
    assignee: initialData?.assignee,
    ai_enhanced: initialData?.ai_enhanced || false,
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

  const handleFormChange = useCallback(
    (data: Partial<TicketFormData>) => {
      const newData = { ...formData, ...data };
      setFormData(newData);
      validateForm(newData);
    },
    [formData, validateForm]
  );

  const resetForm = useCallback(
    (data?: Partial<TicketFormData>) => {
      const newData: TicketFormData = {
        title: data?.title || "",
        description: data?.description || "",
        type: data?.type || "TASK",
        assignee: data?.assignee,
        ai_enhanced: data?.ai_enhanced || false,
      };
      setFormData(newData);
      validateForm(newData);
    },
    [validateForm]
  );

  return {
    formData,
    errors,
    isFormValid,
    handleFormChange,
    resetForm,
    validateForm,
  };
};
