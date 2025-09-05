"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui";
import { MapPin, Heart } from "lucide-react";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [locationPreference, setLocationPreference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-body text-text-secondary">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userType = user.user_metadata?.user_type || "viewer";

  // Redirect planners to their specific onboarding
  if (userType === "planner") {
    router.push("/onboarding/couple");
    return null;
  }

  // Redirect vendors to their specific onboarding
  if (userType === "vendor") {
    router.push("/onboarding/vendor");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Update the user's profile with location preference
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      console.log("🔄 Updating viewer profile with location preference:", {
        userId: user.id,
        locationPreference: locationPreference || null,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from("profiles")
        .update({
          location_preference: locationPreference || null,
          onboarding_completed: true,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating viewer profile:", error);
        alert("Failed to save your preferences. Please try again.");
        return;
      }

      console.log("✅ Profile updated successfully:", data);

      // Force refresh the auth context to update profile state
      if (typeof window !== 'undefined') {
        // Clear any cached auth data to ensure fresh profile fetch
        localStorage.removeItem('momentmoi_auth_cache');
        localStorage.removeItem('momentmoi_profile_cache');
      }

      // Add a small delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("🔄 Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error("💥 Unexpected error during viewer onboarding:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);

    try {
      // Mark onboarding as completed even when skipping
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      console.log("🔄 Skipping viewer onboarding:", {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating profile on skip:", error);
        alert("Failed to complete setup. Please try again.");
        return;
      }

      console.log("✅ Onboarding skipped successfully:", data);

      // Force refresh the auth context to update profile state
      if (typeof window !== 'undefined') {
        // Clear any cached auth data to ensure fresh profile fetch
        localStorage.removeItem('momentmoi_auth_cache');
        localStorage.removeItem('momentmoi_profile_cache');
      }

      // Add a small delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("🔄 Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error("💥 Unexpected error during onboarding skip:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
                Welcome to MomentMoi!
              </CardTitle>
              <CardDescription className="text-body text-text-secondary">
                Let's personalize your experience
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Where are you located? (Optional)
                </label>
                <p className="text-sm text-text-secondary">
                  This helps us show you relevant vendors in your area
                </p>
                <Input
                  type="text"
                  placeholder="e.g., New York, NY or Los Angeles, CA"
                  value={locationPreference}
                  onChange={(e) => setLocationPreference(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  {submitting ? "Setting up..." : "Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
