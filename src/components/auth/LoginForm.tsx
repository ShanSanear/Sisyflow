import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginData } from "../../lib/validation/auth.validation";
import { toast } from "../ui/sonner";
import { signIn } from "../../lib/api";

type LoginFormData = LoginData;

interface LoginFormProps {
  registrationSuccess?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ registrationSuccess = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (registrationSuccess) {
      toast.success("Registration successful! Please check your email to confirm your account.");
    }
  }, [registrationSuccess]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(data);
      // Success - redirect will be handled by the response
      window.location.href = "/board";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      data-testid="login-form-container"
    >
      <CardHeader className="space-y-1">
        <CardTitle
          className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100"
          data-testid="login-title"
        >
          Sign in to your account
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400" data-testid="login-description">
          Enter your email or username and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" data-testid="login-error-alert">
            <AlertDescription data-testid="login-error-message">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email or Username
            </Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Enter your email or username"
              className="w-full"
              {...register("identifier")}
              disabled={isLoading}
              data-testid="identifier-input"
            />
            {errors.identifier && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="identifier-error">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full"
              {...register("password")}
              disabled={isLoading}
              data-testid="password-input"
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="password-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
            data-testid="login-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
