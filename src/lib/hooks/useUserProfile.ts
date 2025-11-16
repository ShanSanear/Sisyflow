import { useState, useEffect, useCallback } from "react";
import { toast } from "../../components/ui/sonner";
import type {
  ProfileDTO,
  UserProfileViewModel,
  UserProfileValidatableFields,
  UpdateProfileCommand,
  UpdatePasswordCommand,
} from "../../types";
import {
  getCurrentUserProfile,
  updateUserProfile,
  updateUserPassword,
  ProfileNotFoundError,
  UsernameAlreadyTakenError,
} from "../api";

/**
 * Hook do zarządzania stanem widoku profilu użytkownika
 * Hermetyzuje całą logikę związaną z zarządzaniem stanem widoku
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  // Initial form state - values will be overridden when profile data loads
  // Note: Both ADMIN and USER roles can access this profile page
  const [formState, setFormState] = useState<UserProfileViewModel>({
    username: "",
    role: "USER" as const, // Temporary placeholder - will be replaced with actual role
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<UserProfileValidatableFields, string>>({
    username: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * Clears password fields after successful update
   */
  const clearPasswordFields = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      currentPassword: "",
      password: "",
      confirmPassword: "",
    }));
  }, []);

  /**
   * Clears validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({
      username: "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    });
  }, []);

  /**
   * Loads user profile data and initializes form state
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileData = await getCurrentUserProfile();
      setProfile(profileData);

      // Initialize form state with profile data
      setFormState({
        username: profileData.username,
        role: profileData.role,
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to load profile data");

      if (error instanceof ProfileNotFoundError) {
        toast.error("Profile not found. Please contact administrator about this error.");
      } else {
        toast.error("Failed to load profile data. Please try again.");
      }

      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates user profile (username and/or password)
   */
  const updateProfile = useCallback(
    async (data: UserProfileViewModel) => {
      setIsSaving(true);
      setError(null);
      clearValidationErrors();

      try {
        let usernameUpdated = false;
        let passwordUpdated = false;

        // Check if username has changed
        const usernameChanged = data.username !== profile?.username;

        // Check if password is being set
        const hasPassword = data.password && data.password.trim().length > 0;

        // Update username if changed
        if (usernameChanged) {
          const usernameCommand: UpdateProfileCommand = {
            username: data.username,
          };

          const updatedProfile = await updateUserProfile(usernameCommand);
          setProfile(updatedProfile);
          setFormState((prev) => ({
            ...prev,
            username: updatedProfile.username,
            role: updatedProfile.role,
          }));
          usernameUpdated = true;
        }

        // Update password if provided
        if (hasPassword && data.password) {
          if (!data.currentPassword) {
            setValidationErrors((prev) => ({
              ...prev,
              currentPassword: "Current password is required to change password.",
            }));
            return;
          }

          const passwordCommand: UpdatePasswordCommand = {
            currentPassword: data.currentPassword,
            newPassword: data.password,
          };

          await updateUserPassword(passwordCommand);
          passwordUpdated = true;
        }

        // Show success message
        if (usernameUpdated && passwordUpdated) {
          toast.success("Username and password have been saved.");
        } else if (usernameUpdated) {
          toast.success("Username has been saved.");
        } else if (passwordUpdated) {
          toast.success("Password has been saved.");
        } else {
          toast.success("Changes have been saved.");
        }

        // Clear password fields after successful update
        if (passwordUpdated) {
          clearPasswordFields();
        }
      } catch (err) {
        const error = err as Error;

        // Handle specific validation errors
        if (error instanceof UsernameAlreadyTakenError) {
          setValidationErrors((prev) => ({
            ...prev,
            username: "This username is already taken.",
          }));
          toast.error("This username is already taken.");
          return;
        }

        // Handle other errors
        setError(error.message || "Failed to update profile");
        toast.error("An unexpected error occurred. Please try again later.");
        console.error("Error updating profile:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [profile, clearValidationErrors, clearPasswordFields]
  );

  // Load profile on mount
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return {
    profile,
    formState,
    isLoading,
    isSaving,
    error,
    validationErrors,
    updateProfile,
    loadProfile, // Allow manual reload if needed
  };
};
