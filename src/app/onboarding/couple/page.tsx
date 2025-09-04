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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Heart,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  PartyPopper,
  Baby,
  Cake,
} from "lucide-react";
import { testCoupleFields } from "@/lib/test-couple-fields";

interface PlannerOnboardingData {
  partnerName: string;
  partnerEmail: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount: string;
  eventStyle: string;
  budgetRange: string;
  planningStage: string;
}

export default function PlannerOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlannerOnboardingData>({
    partnerName: "",
    partnerEmail: "",
    eventType: "",
    eventDate: "",
    eventLocation: "",
    guestCount: "",
    eventStyle: "",
    budgetRange: "",
    planningStage: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    // Ensure user is a planner
    if (!loading && user && user.user_metadata?.user_type !== "planner") {
      router.push("/onboarding");
      return;
    }

    // Test database fields when component mounts
    if (!loading && user) {
      testCoupleFields().then((result) => {
        if (!result.fieldsExist) {
          setError(
            "Database fields not found. Please run the migration: database-couple-onboarding-fields.sql"
          );
        }
      });
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

  if (!user || user.user_metadata?.user_type !== "planner") {
    return null;
  }

  const updateFormData = (
    field: keyof PlannerOnboardingData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear any previous errors when user starts typing
    if (error) setError(null);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      // First, try to get existing couple profile
      let { data: existingProfile, error: fetchError } = await supabase
        .from("couple_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found"
        setError(`Failed to fetch profile: ${fetchError.message}`);
        return;
      }

      let coupleProfileData;

      if (existingProfile) {
        // Update existing couple profile
        const { data: updateData, error: updateError } = await supabase
          .from("couple_profiles")
          .update({
            partner_name: formData.partnerName || null,
            partner_email: formData.partnerEmail || null,
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          setError(`Failed to save partner details: ${updateError.message}`);
          return;
        }

        coupleProfileData = updateData;
      } else {
        // Create new couple profile
        const { data: insertData, error: insertError } = await supabase
          .from("couple_profiles")
          .insert({
            user_id: user.id,
            partner_name: formData.partnerName || null,
            partner_email: formData.partnerEmail || null,
          })
          .select()
          .single();

        if (insertError) {
          setError(`Failed to save partner details: ${insertError.message}`);
          return;
        }

        coupleProfileData = insertData;
      }

      // Create the event using the user's profile ID as planner_id
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          planner_id: user.id, // Use the user's profile ID, not the couple profile ID
          event_type: formData.eventType as any,
          event_date: formData.eventDate || null,
          location: formData.eventLocation || null,
          guest_count: formData.guestCount || null,
          event_style: formData.eventStyle || null,
          budget_range: formData.budgetRange || null,
          planning_stage: formData.planningStage || null,
        })
        .select();

      if (eventError) {
        setError(`Failed to create event: ${eventError.message}`);
        return;
      }

      // Mark onboarding as completed
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .select();

      if (profileError) {
        setError(`Failed to complete onboarding: ${profileError.message}`);
        return;
      }

      // TODO: Send partner invitation email if partner email provided
      if (formData.partnerEmail) {
        // Implement partner invitation logic
      }

      // Add a small delay to ensure the user sees the success state
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "wedding":
        return <Heart className="h-5 w-5" />;
      case "christening":
        return <Baby className="h-5 w-5" />;
      case "party":
        return <PartyPopper className="h-5 w-5" />;
      case "kids_party":
        return <Cake className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventTypeStyles = (eventType: string) => {
    switch (eventType) {
      case "wedding":
        return [
          "Traditional",
          "Modern",
          "Rustic",
          "Destination",
          "Intimate",
          "Luxury",
          "Bohemian",
          "Vintage",
        ];
      case "christening":
        return [
          "Traditional",
          "Modern",
          "Religious",
          "Intimate",
          "Formal",
          "Casual",
        ];
      case "party":
        return [
          "Formal",
          "Casual",
          "Themed",
          "Corporate",
          "Birthday",
          "Anniversary",
          "Celebration",
        ];
      case "kids_party":
        return [
          "Themed",
          "Outdoor",
          "Indoor",
          "Educational",
          "Entertainment",
          "Simple",
        ];
      default:
        return [];
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-primary">
          Tell us about your partner
        </h3>
        <p className="text-sm text-text-secondary">
          We'll help you link your accounts so you can plan together
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary">
            Partner's Full Name *
          </label>
          <Input
            type="text"
            placeholder="Enter your partner's full name"
            value={formData.partnerName}
            onChange={(e) => updateFormData("partnerName", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Partner's Email Address
          </label>
          <p className="text-sm text-text-secondary mb-2">
            We'll send them an invitation to join your planning team
          </p>
          <Input
            type="email"
            placeholder="partner@example.com"
            value={formData.partnerEmail}
            onChange={(e) => updateFormData("partnerEmail", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-primary">Event Details</h3>
        <p className="text-sm text-text-secondary">
          Basic information to help us personalize your experience
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary">
            Event Type *
          </label>
          <Select
            value={formData.eventType}
            onValueChange={(value: string) =>
              updateFormData("eventType", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wedding">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Wedding
                </div>
              </SelectItem>
              <SelectItem value="christening">
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  Christening
                </div>
              </SelectItem>
              <SelectItem value="party">
                <div className="flex items-center gap-2">
                  <PartyPopper className="h-4 w-4" />
                  Party
                </div>
              </SelectItem>
              <SelectItem value="kids_party">
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4" />
                  Kid's Party
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Event Date *
          </label>
          <Input
            type="date"
            value={formData.eventDate}
            onChange={(e) => updateFormData("eventDate", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Event Location *
          </label>
          <Input
            type="text"
            placeholder="e.g., New York, NY or Los Angeles, CA"
            value={formData.eventLocation}
            onChange={(e) => updateFormData("eventLocation", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Expected Guest Count *
          </label>
          <Select
            value={formData.guestCount}
            onValueChange={(value: string) =>
              updateFormData("guestCount", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select guest count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-25">1-25 guests</SelectItem>
              <SelectItem value="26-50">26-50 guests</SelectItem>
              <SelectItem value="51-100">51-100 guests</SelectItem>
              <SelectItem value="101-150">101-150 guests</SelectItem>
              <SelectItem value="151-200">151-200 guests</SelectItem>
              <SelectItem value="200+">200+ guests</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-primary">
          Event Style & Preferences
        </h3>
        <p className="text-sm text-text-secondary">
          This helps us recommend the right vendors for your vision
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary">
            Event Style
          </label>
          <Select
            value={formData.eventStyle}
            onValueChange={(value: string) =>
              updateFormData("eventStyle", value)
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Select your ${
                  formData.eventType || "event"
                } style`}
              />
            </SelectTrigger>
            <SelectContent>
              {getEventTypeStyles(formData.eventType).map((style) => (
                <SelectItem key={style} value={style.toLowerCase()}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Budget Range
          </label>
          <Select
            value={formData.budgetRange}
            onValueChange={(value: string) =>
              updateFormData("budgetRange", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your budget range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-5k">Under $5,000</SelectItem>
              <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
              <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
              <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
              <SelectItem value="100k+">$100,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">
            Planning Stage
          </label>
          <Select
            value={formData.planningStage}
            onValueChange={(value: string) =>
              updateFormData("planningStage", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="How far along are you?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="just-started">
                Just started planning
              </SelectItem>
              <SelectItem value="venue-booked">Venue booked</SelectItem>
              <SelectItem value="vendors-booked">
                Some vendors booked
              </SelectItem>
              <SelectItem value="mostly-done">Mostly done</SelectItem>
              <SelectItem value="final-details">Final details</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Partner Information";
      case 2:
        return "Event Details";
      case 3:
        return "Style & Preferences";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Let's connect you with your partner";
      case 2:
        return "Basic event information";
      case 3:
        return "Help us personalize your experience";
      default:
        return "";
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.partnerName.trim() !== "";
      case 2:
        return (
          formData.eventType &&
          formData.eventDate &&
          formData.eventLocation.trim() !== "" &&
          formData.guestCount
        );
      case 3:
        return true; // All fields optional in step 3
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card variant="elevated" className="max-w-2xl w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-500">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-display text-2xl font-light text-text-primary">
                Welcome to MomentMoi!
              </CardTitle>
              <CardDescription className="text-body text-text-secondary">
                Let's set up your event planning experience
              </CardDescription>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-8 rounded-full ${
                    step <= currentStep ? "bg-primary-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-text-primary">
                {getStepTitle()}
              </h2>
              <p className="text-sm text-text-secondary">
                {getStepDescription()}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!isStepValid()}
                  >
                    {submitting ? "Setting up..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
