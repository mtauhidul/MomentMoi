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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  Building2,
  MapPin,
  Package,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";

type VendorFormData = {
  // Business Information
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  eventTypes: string[];
  emails: string[];
  phones: string[];
  locations: string[];
  // First Service (MVP Simplification)
  firstServiceName: string;
  firstServiceDescription: string;
  firstServicePricingModel: string;
};

const EVENT_TYPES = [
  { value: "wedding", label: "Weddings", icon: "💒" },
  { value: "christening", label: "Christenings", icon: "👶" },
  { value: "party", label: "Parties", icon: "🎉" },
  { value: "kids_party", label: "Kid's Parties", icon: "🎂" },
];

const BUSINESS_CATEGORIES = [
  { value: "cake", label: "Cake & Desserts", icon: "🎂" },
  { value: "dress", label: "Dress & Attire", icon: "👗" },
  { value: "florist", label: "Florist", icon: "🌸" },
  { value: "jeweller", label: "Jewellery", icon: "💍" },
  { value: "music", label: "Music & Entertainment", icon: "🎵" },
  { value: "photographer", label: "Photography", icon: "📸" },
  { value: "transportation", label: "Transportation", icon: "🚗" },
  { value: "venue", label: "Venues", icon: "🏛️" },
  { value: "videographer", label: "Videography", icon: "🎥" },
];

const PRICING_MODELS = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Hourly Rate" },
  { value: "package", label: "Package Deal" },
  { value: "custom", label: "Custom Quote" },
];

const CYPRUS_LOCATIONS = [
  { value: "nicosia", label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca", label: "Larnaca" },
  { value: "paphos", label: "Paphos" },
  { value: "platres", label: "Platres" },
  { value: "paralimni_ayia_napa", label: "Paralimni/Ayia Napa" },
  { value: "whole_cyprus", label: "Whole of Cyprus" },
];

export default function VendorOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    eventTypes: [],
    emails: [""],
    phones: [""],
    locations: [],
    firstServiceName: "",
    firstServiceDescription: "",
    firstServicePricingModel: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const steps = [
    {
      id: 1,
      title: "Business Profile",
      description: "Tell us about your business",
      icon: Building2,
    },
    {
      id: 2,
      title: "Contact & Location",
      description: "How can clients reach you?",
      icon: MapPin,
    },
    {
      id: 3,
      title: "Your First Service",
      description: "Add your main service offering",
      icon: Package,
    },
    {
      id: 4,
      title: "Gallery & Photos",
      description: "Showcase your work with photos",
      icon: () => <span className="text-lg">📸</span>,
    },
  ];

  const handleInputChange = (field: keyof VendorFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (
    field: keyof VendorFormData,
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const addArrayItem = (field: keyof VendorFormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""],
    }));
  };

  const removeArrayItem = (field: keyof VendorFormData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((type) => type !== eventType)
        : [...prev.eventTypes, eventType],
    }));
  };

  const handleLocationToggle = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((loc) => loc !== location)
        : [...prev.locations, location],
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.businessName.trim() !== "" &&
          formData.businessDescription.trim() !== "" &&
          formData.businessCategory !== "" &&
          formData.eventTypes.length > 0
        );
      case 2:
        return (
          formData.emails.some((email) => email.trim() !== "") &&
          formData.phones.some((phone) => phone.trim() !== "") &&
          formData.locations.length > 0
        );
      case 3:
        return (
          formData.firstServiceName.trim() !== "" &&
          formData.firstServiceDescription.trim() !== "" &&
          formData.firstServicePricingModel !== ""
        );
      case 4:
        // Gallery step is optional for now
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error("❌ No user found during onboarding submission");
      alert("Authentication error. Please log in again.");
      return;
    }

    console.log("🚀 Starting vendor onboarding submission...");
    console.log("User ID:", user.id);
    console.log("Form data:", formData);

    setSubmitting(true);
    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const { generateUniqueSlug } = await import("@/lib/slug-utils");
      const supabase = createClientComponentClient();

      // Generate unique slug for the vendor
      let slug: string | undefined;
      try {
        const slugResult = await generateUniqueSlug(formData.businessName);
        slug = slugResult;
      } catch (slugError) {
        console.warn(
          "Failed to generate slug, creating vendor without slug:",
          slugError
        );
        // Continue without slug - it will use ID for routing
      }

      console.log("📝 Creating vendor profile...");
      // Create vendor profile
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          ...(slug && { slug }),
          description: formData.businessDescription,
          business_category: formData.businessCategory,
          event_types: formData.eventTypes,
        })
        .select()
        .single();

      if (profileError) {
        console.error("❌ Error creating vendor profile:", profileError);
        console.error("Profile creation payload:", {
          user_id: user.id,
          business_name: formData.businessName,
          slug,
          description: formData.businessDescription,
          business_category: formData.businessCategory,
          event_types: formData.eventTypes,
        });
        throw new Error(
          `Failed to create vendor profile: ${profileError.message}`
        );
      }

      console.log("✅ Vendor profile created successfully:", vendorProfile);

      // Add contact information
      console.log("📞 Adding contact information...");

      // Add emails
      let emailCount = 0;
      for (let i = 0; i < formData.emails.length; i++) {
        const email = formData.emails[i];
        if (email.trim() !== "") {
          const { error: emailError } = await supabase
            .from("vendor_contacts")
            .insert({
              vendor_id: vendorProfile.id,
              contact_type: "email",
              contact_value: email.trim(),
              is_primary: i === 0,
            });
          if (emailError) {
            console.error("❌ Error adding email contact:", emailError);
            throw new Error(
              `Failed to add email contact: ${emailError.message}`
            );
          }
          emailCount++;
        }
      }

      // Add phones
      let phoneCount = 0;
      for (let i = 0; i < formData.phones.length; i++) {
        const phone = formData.phones[i];
        if (phone.trim() !== "") {
          const { error: phoneError } = await supabase
            .from("vendor_contacts")
            .insert({
              vendor_id: vendorProfile.id,
              contact_type: "phone",
              contact_value: phone.trim(),
              is_primary: i === 0,
            });
          if (phoneError) {
            console.error("❌ Error adding phone contact:", phoneError);
            throw new Error(
              `Failed to add phone contact: ${phoneError.message}`
            );
          }
          phoneCount++;
        }
      }

      // Add locations
      let locationCount = 0;
      for (const location of formData.locations) {
        const { error: locationError } = await supabase
          .from("vendor_locations")
          .insert({
            vendor_id: vendorProfile.id,
            location: location,
          });
        if (locationError) {
          console.error("❌ Error adding location:", locationError);
          throw new Error(`Failed to add location: ${locationError.message}`);
        }
        locationCount++;
      }

      console.log(
        `✅ Added ${emailCount} emails, ${phoneCount} phones, and ${locationCount} locations`
      );

      // Find the service category ID that matches the business category
      const { data: serviceCategory, error: categoryError } = await supabase
        .from("service_categories")
        .select("id")
        .eq("category", formData.businessCategory)
        .single();

      if (categoryError) {
        console.error("Error finding service category:", categoryError);
        console.error("Business category:", formData.businessCategory);
        console.error("Available categories should include:", [
          "cake",
          "dress",
          "florist",
          "jeweller",
          "music",
          "photographer",
          "transportation",
          "venue",
          "videographer",
        ]);

        // Try to fetch all available categories for debugging
        const { data: allCategories } = await supabase
          .from("service_categories")
          .select("category, name");

        console.error(
          "Available service categories in database:",
          allCategories
        );

        throw new Error(
          `Failed to find service category for "${formData.businessCategory}". Make sure the database is seeded with service categories.`
        );
      }

      // Create first service
      console.log("🛠️ Creating first service...");
      const { error: serviceError } = await supabase
        .from("vendor_services")
        .insert({
          vendor_id: vendorProfile.id,
          category_id: serviceCategory.id,
          name: formData.firstServiceName,
          description: formData.firstServiceDescription,
          pricing_model: formData.firstServicePricingModel,
          event_types: formData.eventTypes,
          is_active: true,
        });

      if (serviceError) {
        console.error("❌ Error creating first service:", serviceError);
        console.error("Service creation payload:", {
          vendor_id: vendorProfile.id,
          category_id: serviceCategory.id,
          name: formData.firstServiceName,
          description: formData.firstServiceDescription,
          pricing_model: formData.firstServicePricingModel,
          event_types: formData.eventTypes,
          is_active: true,
        });
        throw new Error(
          `Failed to create first service: ${serviceError.message}`
        );
      }

      console.log("✅ First service created successfully");

      // Update user profile to mark onboarding as complete
      console.log("📝 Updating user profile to mark onboarding as complete...");
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("❌ Error updating user profile:", profileUpdateError);
        throw new Error(
          `Failed to update user profile: ${profileUpdateError.message}`
        );
      }

      console.log("✅ User profile updated successfully");

      console.log("🎉 Vendor onboarding completed successfully!");
      console.log(
        "🔄 Verifying profile creation and redirecting to dashboard..."
      );

      // Verify the vendor profile was created successfully before redirecting
      const { data: verifyProfile, error: verifyError } = await supabase
        .from("vendor_profiles")
        .select("id, business_name")
        .eq("user_id", user.id)
        .single();

      if (verifyError || !verifyProfile) {
        console.error("❌ Profile verification failed:", verifyError);
        throw new Error(
          "Profile creation could not be verified. Please try again."
        );
      }

      console.log("✅ Profile verified successfully:", verifyProfile);

      // Add a small delay to ensure database consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/dashboard/services?created=true");
    } catch (error) {
      console.error("❌ Error in vendor onboarding:", error);

      // Show more specific error message to user
      let errorMessage = "Failed to complete onboarding. Please try again.";

      if (error instanceof Error) {
        // Use the specific error message if available
        if (error.message.includes("service category")) {
          errorMessage =
            "Database configuration issue. Please contact support.";
        } else if (error.message.includes("vendor profile")) {
          errorMessage =
            "Failed to create your business profile. Please try again.";
        } else if (error.message.includes("contact")) {
          errorMessage =
            "Failed to save contact information. Please try again.";
        } else if (error.message.includes("service")) {
          errorMessage = "Failed to create your service. Please try again.";
        } else if (error.message.includes("profile")) {
          errorMessage = "Failed to update your profile. Please try again.";
        }
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

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

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-display text-4xl font-light text-text-primary mb-2">
            Welcome to MomentMoi
          </h1>
          <p className="text-body text-text-secondary">
            Let&apos;s set up your business profile and start offering your
            services
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-border text-text-secondary"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
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

        {/* Step Content */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentStepData.icon className="w-5 h-5" />
              {currentStepData.title}
            </CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Profile */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Name *
                  </label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) =>
                      handleInputChange("businessName", e.target.value)
                    }
                    placeholder="Enter your business name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Description *
                  </label>
                  <textarea
                    value={formData.businessDescription}
                    onChange={(e) =>
                      handleInputChange("businessDescription", e.target.value)
                    }
                    placeholder="Describe your business and what makes you unique"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Category *
                  </label>
                  <Select
                    value={formData.businessCategory}
                    onValueChange={(value) =>
                      handleInputChange("businessCategory", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Event Types You Serve *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EVENT_TYPES.map((eventType) => (
                      <button
                        key={eventType.value}
                        type="button"
                        onClick={() => handleEventTypeToggle(eventType.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          formData.eventTypes.includes(eventType.value)
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-border hover:border-primary-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{eventType.icon}</span>
                          <span className="text-sm font-medium">
                            {eventType.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Addresses *
                  </label>
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={email}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "emails",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="Enter email address"
                        type="email"
                        className="flex-1"
                      />
                      {formData.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("emails", index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("emails")}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Email
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone Numbers *
                  </label>
                  {formData.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={phone}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "phones",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="Enter phone number"
                        type="tel"
                        className="flex-1"
                      />
                      {formData.phones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("phones", index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("phones")}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Phone
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Service Locations *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CYPRUS_LOCATIONS.map((location) => (
                      <button
                        key={location.value}
                        type="button"
                        onClick={() => handleLocationToggle(location.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          formData.locations.includes(location.value)
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-border hover:border-primary-300"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {location.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: First Service */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    🎯 MVP Approach: Start with Your Main Service
                  </h3>
                  <p className="text-sm text-blue-700">
                    We&apos;ll start with your primary service offering. You can
                    add more services later from your dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Service Name *
                  </label>
                  <Input
                    value={formData.firstServiceName}
                    onChange={(e) =>
                      handleInputChange("firstServiceName", e.target.value)
                    }
                    placeholder="e.g., Wedding Photography Package"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Service Description *
                  </label>
                  <textarea
                    value={formData.firstServiceDescription}
                    onChange={(e) =>
                      handleInputChange(
                        "firstServiceDescription",
                        e.target.value
                      )
                    }
                    placeholder="Describe what's included in this service"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Pricing Model *
                  </label>
                  <Select
                    value={formData.firstServicePricingModel}
                    onValueChange={(value) =>
                      handleInputChange("firstServicePricingModel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    ✅ What&apos;s Next?
                  </h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Complete your business profile</li>
                    <li>• Add more services from your dashboard</li>
                    <li>• Start receiving inquiries from event planners</li>
                    <li>• Manage your services and bookings</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Gallery */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">
                    📸 Showcase Your Work
                  </h3>
                  <p className="text-sm text-purple-700">
                    Upload photos of your work to help event planners see your
                    style and quality. You can always add more photos later.
                  </p>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Gallery Coming Soon
                  </h3>
                  <p className="text-text-secondary mb-4">
                    In the full version, you&apos;ll be able to upload photos of
                    your work here. For now, let&apos;s complete your profile
                    setup.
                  </p>
                  <div className="text-sm text-text-secondary">
                    <p className="mb-2">
                      <strong>What you can add:</strong>
                    </p>
                    <ul className="text-left max-w-md mx-auto space-y-1">
                      <li>• Photos of your completed work</li>
                      <li>• Venue decorations and setups</li>
                      <li>• Sample cakes, flowers, or products</li>
                      <li>• Team photos and behind-the-scenes</li>
                      <li>• Before/after transformation images</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    🎉 You&apos;re Almost Done!
                  </h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your business profile is ready</li>
                    <li>• Clients can now find and contact you</li>
                    <li>• Start receiving inquiries and bookings</li>
                    <li>• Add your gallery photos from the dashboard</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!validateStep(currentStep)}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!validateStep(currentStep) || submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
