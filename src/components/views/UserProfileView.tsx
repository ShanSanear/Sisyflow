import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useUserProfile } from "../../lib/hooks/useUserProfile";
import { ProfileForm } from "../profile/ProfileForm";
import { Skeleton } from "../ui/skeleton";

/**
 * Main view component for user profile management
 * Displays user profile information and allows editing username and password
 */
const UserProfileView: React.FC = () => {
  const { profile, formState, isLoading, isSaving, error, validationErrors, updateProfile } = useUserProfile();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-medium">Failed to load profile</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            Manage your account information. You can update your username and change your password here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialData={formState}
            isSaving={isSaving}
            onProfileSubmit={updateProfile}
            validationErrors={validationErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileView;
