"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from "@/components/ui";
import { Heart, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

function ResetPasswordConfirmContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setError("Invalid or expired reset link. Please request a new password reset.");
          setCheckingSession(false);
          return;
        }

        if (session) {
          // We have a valid session from the reset link
          setValidSession(true);
        } else {
          // No session, check for access_token and refresh_token in URL
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session with the tokens from URL
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error("Error setting session:", sessionError);
              setError("Invalid or expired reset link. Please request a new password reset.");
            } else {
              setValidSession(true);
            }
          } else {
            setError("Invalid or expired reset link. Please request a new password reset.");
          }
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [supabase.auth, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Auto redirect after successful password reset
      setTimeout(() => {
        router.push("/auth/login?message=Password updated successfully. Please sign in with your new password.");
      }, 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-body text-text-secondary">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card variant="elevated" className="max-w-md w-full">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-display text-2xl font-light text-text-primary">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription className="text-body text-text-secondary">
                  {error || "This password reset link is invalid or has expired."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Link
                  href="/auth/reset-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Request a new password reset
                </Link>
              </div>
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
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
                Set your new password
              </CardTitle>
              <CardDescription className="text-body text-text-secondary">
                Choose a strong password for your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-text-primary">
                    Password Updated Successfully
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Your password has been updated. You will be redirected to the sign in page shortly.
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Sign in now
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <Button type="submit" loading={loading} disabled={loading} className="w-full">
                  {loading ? "Updating Password..." : "Update Password"}
                </Button>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
