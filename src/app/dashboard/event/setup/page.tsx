"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  Euro,
  Heart,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface EventSetupData {
  event_type: string;
  event_date: string;
  location: string;
  guest_count: string;
  budget_range: string;
  partner_email: string;
  partner_name: string;
}

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding", icon: "💒" },
  { value: "christening", label: "Christening", icon: "👶" },
  { value: "birthday", label: "Birthday Party", icon: "🎂" },
  { value: "anniversary", label: "Anniversary", icon: "💕" },
  { value: "corporate", label: "Corporate Event", icon: "🏢" },
  { value: "other", label: "Other", icon: "🎉" },
];

const BUDGET_RANGES = [
  { value: "Under €5,000", label: "Under €5,000" },
  { value: "€5,000 - €10,000", label: "€5,000 - €10,000" },
  { value: "€10,000 - €20,000", label: "€10,000 - €20,000" },
  { value: "€20,000 - €50,000", label: "€20,000 - €50,000" },
  { value: "Over €50,000", label: "Over €50,000" },
];

const GUEST_COUNT_OPTIONS = [
  { value: "1-50", label: "1-50 guests" },
  { value: "51-100", label: "51-100 guests" },
  { value: "101-150", label: "101-150 guests" },
  { value: "151-200", label: "151-200 guests" },
  { value: "200+", label: "200+ guests" },
];

const steps = [
  {
    id: 1,
    title: "Event Type",
    description: "What type of event are you planning?",
    icon: Calendar,
  },
  {
    id: 2,
    title: "Date & Location",
    description: "When and where will your event take place?",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Guest Count",
    description: "How many guests are you expecting?",
    icon: Users,
  },
  {
    id: 4,
    title: "Budget Range",
    description: "What's your estimated budget?",
    icon: Euro,
  },
  {
    id: 5,
    title: "Partner Invitation",
    description: "Invite your partner to collaborate (optional)",
    icon: Heart,
  },
  {
    id: 6,
    title: "Complete Setup",
    description: "Review and create your event",
    icon: CheckCircle,
  },
];

export default function EventSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingEvent, setExistingEvent] = useState<any>(null);

  const [formData, setFormData] = useState<EventSetupData>({
    event_type: "",
    event_date: "",
    location: "",
    guest_count: "",
    budget_range: "",
    partner_email: "",
    partner_name: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    // Check if user already has an event
    if (user) {
      checkExistingEvent();
    }
  }, [user, authLoading, router]);

  const checkExistingEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("planner_id", user?.id)
        .single();

      if (data) {
        setExistingEvent(data);
        // Redirect to event details if event already exists
        router.push("/dashboard/event");
      }
    } catch (error) {
      // No existing event found, continue with setup
      console.log("No existing event found, proceeding with setup");
    }
  };

  const updateFormData = (field: keyof EventSetupData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.event_type.trim() !== "";
      case 2:
        return (
          formData.event_date.trim() !== "" && formData.location.trim() !== ""
        );
      case 3:
        return formData.guest_count.trim() !== "";
      case 4:
        return formData.budget_range.trim() !== "";
      case 5:
        // Partner invitation is optional
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create the event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          planner_id: user.id,
          event_type: formData.event_type,
          event_date: formData.event_date,
          location: formData.location,
          guest_count: formData.guest_count,
          budget_range: formData.budget_range,
          planning_stage: "Just starting",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // If partner email is provided, create partner invitation
      if (formData.partner_email.trim()) {
        // Create couple profile with partner info
        const { error: coupleError } = await supabase
          .from("couple_profiles")
          .insert({
            user_id: user.id,
            partner_email: formData.partner_email,
            partner_name: formData.partner_name,
          });

        if (coupleError) {
          console.error("Error creating couple profile:", coupleError);
          // Continue anyway as this is not critical
        }
      }

      // Create initial checklist items based on event type
      await createInitialChecklist(eventData.id, formData.event_type);

      // Redirect to the event dashboard
      router.push("/dashboard/event");
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const createInitialChecklist = async (eventId: string, eventType: string) => {
    const checklistTemplates = {
      wedding: [
        "Set wedding date",
        "Choose ceremony venue",
        "Choose reception venue",
        "Book photographer",
        "Book caterer",
        "Choose wedding dress",
        "Book florist",
        "Send save-the-dates",
        "Create guest list",
        "Book entertainment",
      ],
      christening: [
        "Set christening date",
        "Choose church/venue",
        "Book priest/officiant",
        "Choose godparents",
        "Plan reception venue",
        "Book photographer",
        "Choose christening outfit",
        "Send invitations",
        "Plan catering",
        "Choose decorations",
      ],
      birthday: [
        "Set party date",
        "Choose venue",
        "Create guest list",
        "Send invitations",
        "Plan catering",
        "Choose decorations",
        "Book entertainment",
        "Plan activities",
        "Order cake",
        "Prepare party favors",
      ],
      anniversary: [
        "Set anniversary date",
        "Choose venue",
        "Create guest list",
        "Send invitations",
        "Plan catering",
        "Choose decorations",
        "Book entertainment",
        "Plan activities",
        "Order cake",
        "Prepare party favors",
      ],
      corporate: [
        "Set event date",
        "Choose venue",
        "Create attendee list",
        "Send invitations",
        "Plan catering",
        "Choose decorations",
        "Book entertainment",
        "Plan activities",
        "Prepare materials",
        "Set up registration",
      ],
      other: [
        "Set event date",
        "Choose venue",
        "Create guest list",
        "Send invitations",
        "Plan catering",
        "Choose decorations",
        "Book entertainment",
        "Plan activities",
        "Prepare materials",
        "Set up registration",
      ],
    };

    const template =
      checklistTemplates[eventType as keyof typeof checklistTemplates] ||
      checklistTemplates.other;

    const checklistItems = template.map((title, index) => ({
      event_id: eventId,
      title,
      description: `Complete ${title.toLowerCase()}`,
      due_date: null,
      completed: false,
    }));

    await supabase.from("checklist_items").insert(checklistItems);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          What type of event are you planning?
        </h3>
        <p className="text-text-secondary mb-6">
          This will help us customize your planning experience and provide
          relevant vendor recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateFormData("event_type", type.value)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formData.event_type === type.value
                ? "border-primary-500 bg-primary-50"
                : "border-border hover:border-primary-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{type.icon}</span>
              <span className="font-medium text-text-primary">
                {type.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          When and where will your event take place?
        </h3>
        <p className="text-text-secondary mb-6">
          This information helps vendors understand your requirements and
          availability.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Event Date
          </label>
          <Input
            type="date"
            value={formData.event_date}
            onChange={(e) => updateFormData("event_date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Location
          </label>
          <Input
            type="text"
            placeholder="e.g., Limassol, Cyprus"
            value={formData.location}
            onChange={(e) => updateFormData("location", e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          How many guests are you expecting?
        </h3>
        <p className="text-text-secondary mb-6">
          This helps us recommend appropriate venues and vendors for your event
          size.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUEST_COUNT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => updateFormData("guest_count", option.value)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formData.guest_count === option.value
                ? "border-primary-500 bg-primary-50"
                : "border-border hover:border-primary-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-text-primary">
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          What's your estimated budget?
        </h3>
        <p className="text-text-secondary mb-6">
          This helps us recommend vendors that fit within your budget range.
        </p>
      </div>

      <div className="space-y-4">
        {BUDGET_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => updateFormData("budget_range", range.value)}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              formData.budget_range === range.value
                ? "border-primary-500 bg-primary-50"
                : "border-border hover:border-primary-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Euro className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-text-primary">
                {range.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Invite your partner to collaborate
        </h3>
        <p className="text-text-secondary mb-6">
          This is optional - you can invite your partner to help plan the event
          together. They'll have access to all event details and can contribute
          to planning tasks.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Partner's Name
          </label>
          <Input
            type="text"
            placeholder="e.g., John Smith"
            value={formData.partner_name}
            onChange={(e) => updateFormData("partner_name", e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Partner's Email
          </label>
          <Input
            type="email"
            placeholder="e.g., john@example.com"
            value={formData.partner_email}
            onChange={(e) => updateFormData("partner_email", e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-text-muted mt-1">
            We'll send them an invitation to join your event planning.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Review your event details
        </h3>
        <p className="text-text-secondary mb-6">
          Please review the information below before creating your event.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-text-muted">Event Type</span>
            <p className="font-medium text-text-primary">
              {EVENT_TYPES.find((t) => t.value === formData.event_type)?.label}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-muted">Event Date</span>
            <p className="font-medium text-text-primary">
              {formData.event_date
                ? new Date(formData.event_date).toLocaleDateString()
                : "Not set"}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-muted">Location</span>
            <p className="font-medium text-text-primary">
              {formData.location || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-muted">Guest Count</span>
            <p className="font-medium text-text-primary">
              {GUEST_COUNT_OPTIONS.find((g) => g.value === formData.guest_count)
                ?.label || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-muted">Budget Range</span>
            <p className="font-medium text-text-primary">
              {formData.budget_range || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-muted">Partner</span>
            <p className="font-medium text-text-primary">
              {formData.partner_email
                ? `${formData.partner_name} (${formData.partner_email})`
                : "No partner invited"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="font-light text-text-primary mb-2">
            Set Up Your Event
          </h1>
          <p className="text-text-secondary">
            Let's get started with planning your special day
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-border text-text-muted"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-primary-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {renderCurrentStep()}

            <div className="flex justify-between pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !validateStep(currentStep)}
                  className="flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Event...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Create Event</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
}
