import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addUserSchema, type AddUserFormData } from "@/lib/validation/schemas/user";
import type { CreateUserCommand } from "@/types";

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (command: CreateUserCommand) => Promise<void>;
}

export function AddUserDialog({ isOpen, onOpenChange, onAddUser }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
  });

  const onSubmit = async (data: AddUserFormData) => {
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...userData } = data;
      const command: CreateUserCommand = {
        ...userData,
        role: "USER" as const, // Fixed role for MVP
      };
      await onAddUser(command);
      reset();
    } catch {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </Label>
            <Input id="username" {...register("username")} placeholder="Enter username" />
            {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input id="email" {...register("email")} placeholder="Enter email address" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </Label>
            <Input id="password" type="password" {...register("password")} placeholder="Enter password" />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
