import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { registerFormSchema, type RegisterFormData } from "../../lib/validation/auth.validation";
import { signUp } from "../../lib/api";

export const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...userData } = data;
      await signUp(userData);
      // Registration successful - redirect immediately to login page with success parameter
      window.location.href = "/login?registration=success";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
          Create your account
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400">
          Set up the first administrator account for your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              className="w-full"
              {...register("username")}
              disabled={isLoading}
            />
            {errors.username && <p className="text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              className="w-full"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters long</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="w-full"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
