import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { UserProfileViewModel, UserProfileValidatableFields } from "../../types";

interface ProfileFormProps {
  initialData: UserProfileViewModel;
  isSaving: boolean;
  onProfileSubmit: (data: UserProfileViewModel) => void;
  validationErrors: Record<UserProfileValidatableFields, string>;
}

/**
 * Form component for editing user profile information
 * Handles username and password changes with client-side validation
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  isSaving,
  onProfileSubmit,
  validationErrors,
}) => {
  const [formData, setFormData] = useState<UserProfileViewModel>(initialData);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update form data when initialData changes (e.g., when profile loads)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (field: keyof UserProfileViewModel, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const errors: Record<UserProfileValidatableFields, string> = {
      username: "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    };

    // Username validation
    if (!formData.username || formData.username.trim().length < 3 || formData.username.trim().length > 50) {
      errors.username = "Username must be between 3 and 50 characters.";
    } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, underscores and dots.";
    }

    // Password validation (only if password is provided)
    const hasPassword = formData.password && formData.password.trim().length > 0;
    if (hasPassword && formData.password) {
      // Require current password when changing password
      if (!formData.currentPassword || formData.currentPassword.trim().length === 0) {
        errors.currentPassword = "Current password is required to change your password.";
      }

      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = "Password must contain at least one lowercase letter, one uppercase letter, and one number.";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some((error) => error.length > 0);
    if (hasErrors) {
      // Note: Validation errors are handled by the parent component via the hook
      // We just call onProfileSubmit and let the hook handle validation
    }

    onProfileSubmit(formData);
  };

  // Check if form has changes compared to initial data
  const hasChanges = () => {
    const usernameChanged = formData.username !== initialData.username;
    const passwordChangeAttempted =
      (formData.currentPassword && formData.currentPassword.trim().length > 0) ||
      (formData.password && formData.password.trim().length > 0) ||
      (formData.confirmPassword && formData.confirmPassword.trim().length > 0);
    return usernameChanged || passwordChangeAttempted;
  };

  const isSubmitDisabled = isSaving || !hasChanges();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange("username", e.target.value)}
          disabled={isSaving}
          className={validationErrors.username ? "border-red-500" : ""}
        />
        {validationErrors.username && <p className="text-sm text-red-600">{validationErrors.username}</p>}
      </div>

      {/* Role Field (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          type="text"
          value={formData.role}
          disabled
          className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
        />
        <p className="text-sm text-muted-foreground">Your account role cannot be changed.</p>
      </div>

      {/* Current Password Field */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={formData.currentPassword || ""}
            onChange={(e) => handleInputChange("currentPassword", e.target.value)}
            disabled={isSaving}
            className={validationErrors.currentPassword ? "border-red-500" : ""}
            placeholder="Enter your current password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            disabled={isSaving}
          >
            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {validationErrors.currentPassword && <p className="text-sm text-red-600">{validationErrors.currentPassword}</p>}
        <p className="text-sm text-muted-foreground">Required only when changing your password.</p>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">New Password (optional)</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password || ""}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={isSaving}
            className={validationErrors.password ? "border-red-500" : ""}
            placeholder="Leave empty to keep current password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSaving}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {validationErrors.password && <p className="text-sm text-red-600">{validationErrors.password}</p>}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword || ""}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            disabled={isSaving}
            className={validationErrors.confirmPassword ? "border-red-500" : ""}
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSaving}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {validationErrors.confirmPassword && <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitDisabled} className="w-full">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};
