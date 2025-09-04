"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  AuthErrorBoundary,
} from "@/components/ui";
import { Heart, Users, Building2 } from "lucide-react";

type UserType = "planner" | "vendor" | "viewer";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<UserType>("planner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation with logging
    console.log("📝 Starting registration validation", {
      email: email.split("@")[0] + "@***",
      userType,
      fullNameLength: fullName.length,
      passwordLength: password.length,
      timestamp: new Date().toISOString(),
    });

    // Validate passwords match
    if (password !== confirmPassword) {
      const validationError = "Passwords do not match";
      console.warn("❌ Registration validation failed:", {
        reason: "password_mismatch",
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });
      setError(validationError);
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      const validationError = "Password must be at least 6 characters long";
      console.warn("❌ Registration validation failed:", {
        reason: "password_too_short",
        passwordLength: password.length,
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });
      setError(validationError);
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const validationError = "Please enter a valid email address";
      console.warn("❌ Registration validation failed:", {
        reason: "invalid_email_format",
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });
      setError(validationError);
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!fullName.trim()) {
      const validationError = "Full name is required";
      console.warn("❌ Registration validation failed:", {
        reason: "missing_full_name",
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });
      setError(validationError);
      setLoading(false);
      return;
    }

    const userData = {
      full_name: fullName.trim(),
      user_type: userType,
    };

    console.log("🚀 Attempting user registration:", {
      email: email.split("@")[0] + "@***",
      userType,
      fullName: fullName.substring(0, 2) + "***",
      attemptNumber: retryCount + 1,
      timestamp: new Date().toISOString(),
    });

    try {
      const { error: signupError } = await signUp(email, password, userData);

      if (signupError) {
        console.error("❌ Registration failed:", {
          error: signupError.message,
          type: signupError.type,
          code: signupError.code,
          retryable: signupError.retryable,
          email: email.split("@")[0] + "@***",
          userType,
          attemptNumber: retryCount + 1,
          timestamp: new Date().toISOString(),
        });

        // Handle specific error types with user-friendly messages
        let userFriendlyError = signupError.userMessage || signupError.message;

        // If retryable and we haven't exceeded max retries, show retry option
        if (signupError.retryable && retryCount < 2) {
          userFriendlyError += " You can try again.";
          setRetryCount((prev) => prev + 1);
        } else if (signupError.retryable && retryCount >= 2) {
          userFriendlyError +=
            " If the problem persists, please contact support.";
        }

        setError(userFriendlyError);
        setLoading(false);
        return;
      }

      // Success - log and redirect
      console.log("✅ Registration successful:", {
        email: email.split("@")[0] + "@***",
        userType,
        timestamp: new Date().toISOString(),
      });

      setRetryCount(0); // Reset retry count on success

      // Show success message and redirect to login
      router.push(
        "/auth/login?message=Please check your email to verify your account"
      );
    } catch (unexpectedError: any) {
      // Catch any unexpected errors that might slip through
      console.error("💥 Unexpected error during registration:", {
        error: unexpectedError.message,
        stack: unexpectedError.stack,
        email: email.split("@")[0] + "@***",
        userType,
        timestamp: new Date().toISOString(),
      });

      setError(
        "An unexpected error occurred. Please try again or contact support if the problem persists."
      );
      setLoading(false);
    }
  };

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card variant="elevated" className="max-w-md w-full">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-500">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-display text-2xl font-light text-text-primary">
                  Join MomentMoi
                </CardTitle>
                <CardDescription className="text-body text-text-secondary">
                  Create your event planning account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary">
                    I am a...
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={
                        userType === "planner" ? "stacked" : "stacked-outline"
                      }
                      onClick={() => setUserType("planner")}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                    >
                      <Users className="h-5 w-5" />
                      <span>Planner</span>
                    </Button>
                    <Button
                      type="button"
                      variant={
                        userType === "vendor" ? "stacked" : "stacked-outline"
                      }
                      onClick={() => setUserType("vendor")}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Vendor</span>
                    </Button>
                    <Button
                      type="button"
                      variant={
                        userType === "viewer" ? "stacked" : "stacked-outline"
                      }
                      onClick={() => setUserType("viewer")}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                    >
                      <Heart className="h-5 w-5" />
                      <span>Viewer</span>
                    </Button>
                  </div>
                </div>

                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full">
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
