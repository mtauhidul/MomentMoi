"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, ClientDashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Toast,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Building2,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Heart,
  Bell,
  Shield,
  Calendar,
} from "lucide-react";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { createClientComponentClient } from "@/lib/supabase";
import {
  uploadFile,
  deleteFile,
  generateUniqueFilename,
  extractPathFromUrl,
} from "@/lib/storage";

const businessCategories = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "florist", label: "Florist" },
  { value: "venue", label: "Venue" },
  { value: "music", label: "Music" },
  { value: "cake", label: "Cake" },
  { value: "dress", label: "Dress" },
  { value: "jeweller", label: "Jeweller" },
  { value: "transportation", label: "Transportation" },
];

const eventTypes = [
  { value: "wedding", label: "Wedding" },
  { value: "christening", label: "Christening" },
  { value: "party", label: "Party" },
  { value: "kids_party", label: "Kids Party" },
];

const cyprusLocations = [
  { value: "nicosia", label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca", label: "Larnaca" },
  { value: "paphos", label: "Paphos" },
  { value: "platres", label: "Platres" },
  { value: "paralimni_ayia_napa", label: "Paralimni/Ayia Napa" },
  { value: "whole_cyprus", label: "Whole Cyprus" },
];

interface ContactMethod {
  id: string;
  type: "email" | "phone";
  value: string;
  isPrimary: boolean;
}

interface ClientProfileData {
  full_name: string;
  email: string;
  location_preference: string;
  avatar_url: string | null;
}

interface CoupleProfileData {
  partner_name: string;
  partner_email: string;
}

interface ClientNotificationSettings {
  email_notifications: boolean;
  vendor_updates: boolean;
  event_reminders: boolean;
  partner_notifications: boolean;
}

interface EventOverviewData {
  id: string;
  event_type: string;
  event_date: string;
  location: string;
  planning_stage: string;
  ceremony_venue?: string;
  reception_venue?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    contacts,
    locations,
    loading: profileLoading,
    error,
    saveProfile,
    refetch,
  } = useVendorProfile();
  const router = useRouter();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userType, setUserType] = useState<
    "vendor" | "planner" | "viewer" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Client profile state
  const [clientProfileData, setClientProfileData] = useState<ClientProfileData>(
    {
      full_name: "",
      email: "",
      location_preference: "",
      avatar_url: null,
    }
  );

  const [coupleProfileData, setCoupleProfileData] = useState<CoupleProfileData>(
    {
      partner_name: "",
      partner_email: "",
    }
  );

  const [notificationSettings, setNotificationSettings] =
    useState<ClientNotificationSettings>({
      email_notifications: true,
      vendor_updates: true,
      event_reminders: true,
      partner_notifications: true,
    });

  const [eventOverview, setEventOverview] = useState<EventOverviewData | null>(
    null
  );
  const [eventLoading, setEventLoading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    business_category: "",
    event_types: [] as string[],
    logo_url: null as string | null,
    contacts: [] as Array<{
      contact_type: "email" | "phone";
      contact_value: string;
      is_primary: boolean;
    }>,
    locations: [] as string[],
  });

  // Track original data to detect changes
  const [originalData, setOriginalData] = useState({
    business_name: "",
    description: "",
    business_category: "",
    event_types: [] as string[],
    logo_url: null as string | null,
    contacts: [] as Array<{
      contact_type: "email" | "phone";
      contact_value: string;
      is_primary: boolean;
    }>,
    locations: [] as string[],
  });

  // Local form state for better UX
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [additionalContacts, setAdditionalContacts] = useState<ContactMethod[]>(
    []
  );

  // Check if form has changes
  const hasChanges = () => {
    if (userType === "vendor") {
      return (
        formData.business_name !== originalData.business_name ||
        formData.description !== originalData.description ||
        formData.business_category !== originalData.business_category ||
        JSON.stringify(formData.event_types) !==
          JSON.stringify(originalData.event_types) ||
        formData.logo_url !== originalData.logo_url ||
        JSON.stringify(formData.contacts) !==
          JSON.stringify(originalData.contacts) ||
        JSON.stringify(formData.locations) !==
          JSON.stringify(originalData.locations)
      );
    } else if (userType === "planner") {
      // For planners, we need to track changes in client profile data
      // Since we don't have original data for planner fields, we'll check if any fields are filled
      return (
        clientProfileData.full_name.trim() !== "" ||
        clientProfileData.location_preference !== "" ||
        coupleProfileData.partner_name.trim() !== "" ||
        coupleProfileData.partner_email.trim() !== ""
      );
    }
    return false;
  };

  // Load user type and profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        const supabase = createClientComponentClient();
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select(
            "user_type, full_name, email, location_preference, avatar_url"
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setUserType(userProfile.user_type as "vendor" | "planner" | "viewer");

        if (userProfile.user_type === "vendor") {
          // Vendor profile is handled by useVendorProfile hook
        } else {
          // Load client profile data
          setClientProfileData({
            full_name: userProfile.full_name || "",
            email: userProfile.email,
            location_preference: userProfile.location_preference || "",
            avatar_url: userProfile.avatar_url,
          });

          // Load couple profile and event data if user is a planner
          if (userProfile.user_type === "planner") {
            // Load couple profile
            const { data: coupleProfile } = await supabase
              .from("couple_profiles")
              .select("*")
              .eq("user_id", user.id)
              .single();

            if (coupleProfile) {
              setCoupleProfileData({
                partner_name: coupleProfile.partner_name || "",
                partner_email: coupleProfile.partner_email || "",
              });
            }

            // Load event overview
            setEventLoading(true);
            const { data: eventData } = await supabase
              .from("events")
              .select(
                "id, event_type, event_date, location, planning_stage, ceremony_venue, reception_venue"
              )
              .eq("planner_id", user.id)
              .single();

            if (eventData) {
              setEventOverview(eventData as EventOverviewData);
            }
            setEventLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setToast({
          message: "Error loading profile data. Please try again.",
          type: "error",
          isVisible: true,
        });
      }
    };

    loadUserProfile();
  }, [user?.id]);

  // Initialize form data when profile loads or when no profile exists
  useEffect(() => {
    // Only initialize if we have user data and profile loading is complete
    if (!user || profileLoading) return;

    if (profile) {
      // Profile exists, load data from it
      const newFormData = {
        business_name: profile.business_name || "",
        description: profile.description || "",
        business_category: profile.business_category || "",
        event_types: profile.event_types || [],
        logo_url: profile.logo_url,
        contacts: contacts.map((contact) => ({
          contact_type: contact.contact_type,
          contact_value: contact.contact_value,
          is_primary: contact.is_primary,
        })),
        locations: locations.map((location) => location.location),
      };

      setFormData(newFormData);
      setOriginalData(newFormData);

      // Set up additional contacts
      const additionalContactsData = contacts.filter((c) => !c.is_primary);
      setAdditionalContacts(
        additionalContactsData.map((c) => ({
          id: c.id,
          type: c.contact_type,
          value: c.contact_value,
          isPrimary: c.is_primary,
        }))
      );
    } else if (!profileLoading && !error && userType === "vendor") {
      // No profile exists yet (new vendor), initialize with defaults
      console.log("No vendor profile found, initializing with defaults");
      const defaultFormData = {
        business_name: "",
        description: "",
        business_category: "",
        event_types: [] as string[],
        logo_url: null as string | null,
        contacts: [
          {
            contact_type: "email" as const,
            contact_value: user?.email || "",
            is_primary: true,
          },
        ],
        locations: [] as string[],
      };

      setFormData(defaultFormData);
      setOriginalData(defaultFormData);
      setAdditionalContacts([]);
    }
  }, [user, profileLoading, profile, contacts, locations, error, userType]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Logo upload handler
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLogoError(null);
    setLogoUploading(true);

    try {
      const filename = generateUniqueFilename(file.name, user.id);
      const result = await uploadFile(file, "vendor-logos", filename);

      if (result.success && result.url) {
        setLogoFile(file);
        setFormData((prev) => ({
          ...prev,
          logo_url: result.url || null,
        }));
      } else {
        setLogoError(result.error || "Upload failed");
      }
    } catch (error) {
      setLogoError("An unexpected error occurred");
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!user) return;

    try {
      if (formData.logo_url && formData.logo_url.includes("supabase.co")) {
        const path = extractPathFromUrl(formData.logo_url);
        if (path) {
          await deleteFile("vendor-logos", path);
        }
      }
      setLogoFile(null);
      setFormData((prev) => ({
        ...prev,
        logo_url: null,
      }));
    } catch (error) {
      console.error("Error removing logo:", error);
    }
  };

  // Contact management
  const addContact = () => {
    const newContact: ContactMethod = {
      id: Date.now().toString(),
      type: "email",
      value: "",
      isPrimary: false,
    };
    setAdditionalContacts((prev) => [...prev, newContact]);
  };

  const removeContact = (id: string) => {
    setAdditionalContacts((prev) =>
      prev.filter((contact) => contact.id !== id)
    );
  };

  const updateContact = (
    id: string,
    field: keyof ContactMethod,
    value: any
  ) => {
    setAdditionalContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const setPrimaryContact = (id: string) => {
    setAdditionalContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        isPrimary: contact.id === id,
      }))
    );
  };

  // Update form data when local state changes
  useEffect(() => {
    const allContacts = [
      // Primary email
      ...(formData.contacts.find(
        (c) => c.contact_type === "email" && c.is_primary
      )
        ? [
            {
              contact_type: "email" as const,
              contact_value:
                formData.contacts.find(
                  (c) => c.contact_type === "email" && c.is_primary
                )?.contact_value || "",
              is_primary: true,
            },
          ]
        : []),
      // Primary phone
      ...(formData.contacts.find(
        (c) => c.contact_type === "phone" && c.is_primary
      )
        ? [
            {
              contact_type: "phone" as const,
              contact_value:
                formData.contacts.find(
                  (c) => c.contact_type === "phone" && c.is_primary
                )?.contact_value || "",
              is_primary: true,
            },
          ]
        : []),
      // Additional contacts
      ...additionalContacts.map((contact) => ({
        contact_type: contact.type,
        contact_value: contact.value,
        is_primary: contact.isPrimary,
      })),
    ];

    setFormData((prev) => ({
      ...prev,
      contacts: allContacts,
    }));
  }, [additionalContacts]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (userType === "vendor") {
        // Use existing vendor save functionality
        const result = await saveProfile(formData);
        if (result.success) {
          setToast({
            message: "Profile saved successfully!",
            type: "success",
            isVisible: true,
          });
          setOriginalData(formData);
          // Refetch profile data to update the UI
          await refetch();
        } else {
          setToast({
            message: `Error saving profile: ${result.error}`,
            type: "error",
            isVisible: true,
          });
        }
      } else if (userType === "planner") {
        // Save planner profile data
        const supabase = createClientComponentClient();

        // Update profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: clientProfileData.full_name,
            location_preference: clientProfileData.location_preference,
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Update or insert couple profile data
        if (coupleProfileData.partner_name || coupleProfileData.partner_email) {
          const { error: coupleError } = await supabase
            .from("couple_profiles")
            .upsert({
              user_id: user.id,
              partner_name: coupleProfileData.partner_name,
              partner_email: coupleProfileData.partner_email,
            });

          if (coupleError) throw coupleError;
        }

        setToast({
          message: "Profile saved successfully!",
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setToast({
        message: "Error saving profile. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render appropriate layout based on user type
  const Layout =
    userType === "vendor" ? DashboardLayout : ClientDashboardLayout;

  return (
    <Layout>
      <div className="space-y-6 max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="font-light text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">
              {userType === "vendor"
                ? "Manage your business profile and contact information"
                : "Manage your personal profile and event planning preferences"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode ? "Edit Mode" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges()}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                hasChanges() && !isSaving
                  ? "text-white bg-primary-600 hover:bg-primary-700"
                  : "text-gray-400 bg-gray-100"
              } disabled:opacity-50`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Profile Forms */}
        {userType === "vendor" ? (
          // Vendor Profile Content
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-800">
                      Error loading profile: {error}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!profile && !profileLoading && !error && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-800">
                      Welcome! Please fill out your business profile information
                      below. This will be used to display your services to
                      potential clients.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Business Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPreviewMode ? (
                    <div className="space-y-4">
                      {formData.business_name && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Business Name
                          </span>
                          <p className="text-gray-900">
                            {formData.business_name}
                          </p>
                        </div>
                      )}
                      {formData.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Description
                          </span>
                          <p className="text-gray-900">
                            {formData.description}
                          </p>
                        </div>
                      )}
                      {formData.business_category && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Category
                          </span>
                          <p className="text-gray-900">
                            {
                              businessCategories.find(
                                (c) => c.value === formData.business_category
                              )?.label
                            }
                          </p>
                        </div>
                      )}
                      {formData.event_types.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Event Types
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.event_types.map((type) => (
                              <span
                                key={type}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                              >
                                {
                                  eventTypes.find((t) => t.value === type)
                                    ?.label
                                }
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.logo_url && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Logo
                          </span>
                          <img
                            src={formData.logo_url}
                            alt="Business logo"
                            className="w-16 h-16 object-cover rounded-lg mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Business Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name *
                        </label>
                        <Input
                          value={formData.business_name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              business_name: e.target.value,
                            }))
                          }
                          placeholder="Enter your business name"
                        />
                      </div>

                      {/* Business Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe your business and services"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      {/* Business Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Category *
                        </label>
                        <Select
                          value={formData.business_category}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              business_category: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessCategories.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Event Types */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Event Types *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {eventTypes.map((type) => (
                            <label
                              key={type.value}
                              className="flex items-center space-x-2 cursor-pointer p-3 border border-border rounded-lg hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={formData.event_types.includes(
                                  type.value
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      event_types: [
                                        ...prev.event_types,
                                        type.value,
                                      ],
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      event_types: prev.event_types.filter(
                                        (t) => t !== type.value
                                      ),
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-700">
                                {type.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Logo
                        </label>
                        <div className="flex items-center gap-4">
                          {formData.logo_url ? (
                            <div className="flex items-center gap-4">
                              <img
                                src={formData.logo_url}
                                alt="Business logo"
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Upload Logo
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                  disabled={logoUploading}
                                />
                              </label>
                              {logoUploading && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                                  Uploading...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {logoError && (
                          <p className="text-sm text-red-600 mt-1">
                            {logoError}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPreviewMode ? (
                    <div className="space-y-4">
                      {formData.contacts.find(
                        (c) => c.contact_type === "email" && c.is_primary
                      ) && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {
                              formData.contacts.find(
                                (c) =>
                                  c.contact_type === "email" && c.is_primary
                              )?.contact_value
                            }
                          </span>
                        </div>
                      )}
                      {formData.contacts.find(
                        (c) => c.contact_type === "phone" && c.is_primary
                      ) && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {
                              formData.contacts.find(
                                (c) =>
                                  c.contact_type === "phone" && c.is_primary
                              )?.contact_value
                            }
                          </span>
                        </div>
                      )}
                      {additionalContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3"
                        >
                          {contact.type === "email" ? (
                            <Mail className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Phone className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-gray-700">{contact.value}</span>
                          {contact.isPrimary && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Primary Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Email *
                        </label>
                        <Input
                          type="email"
                          value={
                            formData.contacts.find(
                              (c) => c.contact_type === "email" && c.is_primary
                            )?.contact_value || ""
                          }
                          onChange={(e) => {
                            const primaryEmail = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              contacts: [
                                ...prev.contacts.filter(
                                  (c) =>
                                    !(
                                      c.contact_type === "email" && c.is_primary
                                    )
                                ),
                                ...(primaryEmail
                                  ? [
                                      {
                                        contact_type: "email" as const,
                                        contact_value: primaryEmail,
                                        is_primary: true,
                                      },
                                    ]
                                  : []),
                                ...prev.contacts.filter(
                                  (c) =>
                                    c.contact_type === "phone" && c.is_primary
                                ),
                                ...additionalContacts.map((contact) => ({
                                  contact_type: contact.type,
                                  contact_value: contact.value,
                                  is_primary: contact.isPrimary,
                                })),
                              ],
                            }));
                          }}
                          placeholder="your@email.com"
                        />
                      </div>

                      {/* Primary Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Phone *
                        </label>
                        <Input
                          type="tel"
                          value={
                            formData.contacts.find(
                              (c) => c.contact_type === "phone" && c.is_primary
                            )?.contact_value || ""
                          }
                          onChange={(e) => {
                            const primaryPhone = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              contacts: [
                                ...prev.contacts.filter(
                                  (c) =>
                                    c.contact_type === "email" && c.is_primary
                                ),
                                ...(primaryPhone
                                  ? [
                                      {
                                        contact_type: "phone" as const,
                                        contact_value: primaryPhone,
                                        is_primary: true,
                                      },
                                    ]
                                  : []),
                                ...prev.contacts.filter(
                                  (c) =>
                                    !(
                                      c.contact_type === "phone" && c.is_primary
                                    )
                                ),
                                ...additionalContacts.map((contact) => ({
                                  contact_type: contact.type,
                                  contact_value: contact.value,
                                  is_primary: contact.isPrimary,
                                })),
                              ],
                            }));
                          }}
                          placeholder="+357 99 123 456"
                        />
                      </div>

                      {/* Additional Contacts */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Additional Contacts
                          </label>
                          <button
                            type="button"
                            onClick={addContact}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                          >
                            <Plus className="w-3 h-3" />
                            Add Contact
                          </button>
                        </div>
                        <div className="space-y-3">
                          {additionalContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center gap-3 p-3 border border-border rounded-lg"
                            >
                              <Select
                                value={contact.type}
                                onValueChange={(value: "email" | "phone") =>
                                  updateContact(contact.id, "type", value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type={
                                  contact.type === "email" ? "email" : "tel"
                                }
                                value={contact.value}
                                onChange={(e) =>
                                  updateContact(
                                    contact.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder={
                                  contact.type === "email"
                                    ? "contact@email.com"
                                    : "+357 99 123 456"
                                }
                                className="flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => setPrimaryContact(contact.id)}
                                className={`px-3 py-1 text-xs rounded-full ${
                                  contact.isPrimary
                                    ? "bg-primary-100 text-primary-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                Primary
                              </button>
                              <button
                                type="button"
                                onClick={() => removeContact(contact.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Service Locations Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPreviewMode ? (
                    <div className="space-y-4">
                      {formData.locations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.locations.map((location) => (
                            <span
                              key={location}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                            >
                              <MapPin className="w-3 h-3" />
                              {
                                cyprusLocations.find(
                                  (loc) => loc.value === location
                                )?.label
                              }
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No locations selected
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Service Locations */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Where do you provide services? *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {cyprusLocations.map((location) => (
                            <label
                              key={location.value}
                              className="flex items-center space-x-2 cursor-pointer p-3 border border-border rounded-lg transition-[background-color] duration-150 ease-out hover:bg-gray-50 hover:transition-none"
                            >
                              <input
                                type="checkbox"
                                checked={formData.locations.includes(
                                  location.value
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      locations: [
                                        ...prev.locations,
                                        location.value,
                                      ],
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      locations: prev.locations.filter(
                                        (loc) => loc !== location.value
                                      ),
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-700">
                                {location.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : userType === "planner" ? (
          // Planner Profile Content
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPreviewMode ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {clientProfileData.avatar_url ? (
                          <img
                            src={clientProfileData.avatar_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {clientProfileData.full_name || "No name set"}
                          </h3>
                          <p className="text-gray-600">
                            {clientProfileData.email}
                          </p>
                        </div>
                      </div>
                      {clientProfileData.location_preference && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {cyprusLocations.find(
                              (loc) =>
                                loc.value ===
                                clientProfileData.location_preference
                            )?.label || clientProfileData.location_preference}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          value={clientProfileData.full_name}
                          onChange={(e) =>
                            setClientProfileData((prev) => ({
                              ...prev,
                              full_name: e.target.value,
                            }))
                          }
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={clientProfileData.email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Email cannot be changed from profile settings
                        </p>
                      </div>

                      {/* Location Preference */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Location
                        </label>
                        <Select
                          value={clientProfileData.location_preference}
                          onValueChange={(value) =>
                            setClientProfileData((prev) => ({
                              ...prev,
                              location_preference: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preferred location" />
                          </SelectTrigger>
                          <SelectContent>
                            {cyprusLocations.map((location) => (
                              <SelectItem
                                key={location.value}
                                value={location.value}
                              >
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : eventOverview ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <div>
                          <span className="text-gray-700 font-medium">
                            {eventOverview.event_type.charAt(0).toUpperCase() +
                              eventOverview.event_type.slice(1)}
                          </span>
                          <p className="text-gray-600 text-sm">
                            {eventOverview.event_date
                              ? new Date(
                                  eventOverview.event_date
                                ).toLocaleDateString()
                              : "Date not set"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span className="text-gray-700">
                          {eventOverview.location || "Location not set"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-primary-500" />
                        <span className="text-gray-700">
                          {eventOverview.planning_stage ||
                            "Planning stage not set"}
                        </span>
                      </div>

                      {(eventOverview.ceremony_venue ||
                        eventOverview.reception_venue) && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Venues:</p>
                          {eventOverview.ceremony_venue && (
                            <div className="flex items-center gap-3 text-sm">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              <span>
                                Ceremony: {eventOverview.ceremony_venue}
                              </span>
                            </div>
                          )}
                          {eventOverview.reception_venue && (
                            <div className="flex items-center gap-3 text-sm">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              <span>
                                Reception: {eventOverview.reception_venue}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-3">
                        <Link
                          href="/dashboard/event"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View full event details →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm mb-3">
                        No event set up yet
                      </p>
                      <Link
                        href="/dashboard/event/setup"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Set up your event →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Couple Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Partner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPreviewMode ? (
                    <div className="space-y-4">
                      {coupleProfileData.partner_name && (
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-primary-500" />
                          <div>
                            <span className="text-gray-700 font-medium">
                              {coupleProfileData.partner_name}
                            </span>
                            {coupleProfileData.partner_email && (
                              <p className="text-gray-600 text-sm">
                                {coupleProfileData.partner_email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {!coupleProfileData.partner_name && (
                        <p className="text-gray-500 text-sm">
                          No partner information added yet
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Partner Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Partner's Name
                        </label>
                        <Input
                          value={coupleProfileData.partner_name}
                          onChange={(e) =>
                            setCoupleProfileData((prev) => ({
                              ...prev,
                              partner_name: e.target.value,
                            }))
                          }
                          placeholder="Enter your partner's name"
                        />
                      </div>

                      {/* Partner Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Partner's Email
                        </label>
                        <Input
                          type="email"
                          value={coupleProfileData.partner_email}
                          onChange={(e) =>
                            setCoupleProfileData((prev) => ({
                              ...prev,
                              partner_email: e.target.value,
                            }))
                          }
                          placeholder="partner@example.com"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Optional: Add your partner to collaborate on planning
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Notification Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreviewMode ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          Email Notifications
                        </span>
                        <span
                          className={`text-sm ${
                            notificationSettings.email_notifications
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {notificationSettings.email_notifications
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          Vendor Updates
                        </span>
                        <span
                          className={`text-sm ${
                            notificationSettings.vendor_updates
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {notificationSettings.vendor_updates
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          Event Reminders
                        </span>
                        <span
                          className={`text-sm ${
                            notificationSettings.event_reminders
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {notificationSettings.event_reminders
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          Partner Notifications
                        </span>
                        <span
                          className={`text-sm ${
                            notificationSettings.partner_notifications
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {notificationSettings.partner_notifications
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Email Notifications
                          </label>
                          <p className="text-xs text-gray-500">
                            Receive email updates about your event
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_notifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              email_notifications: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Vendor Updates
                          </label>
                          <p className="text-xs text-gray-500">
                            Get notified about vendor responses and updates
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.vendor_updates}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              vendor_updates: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Event Reminders
                          </label>
                          <p className="text-xs text-gray-500">
                            Receive reminders about upcoming deadlines
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.event_reminders}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              event_reminders: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Partner Notifications
                          </label>
                          <p className="text-xs text-gray-500">
                            Get notified about partner activity
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.partner_notifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              partner_notifications: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Viewer Profile Content - Placeholder for now
          <div className="text-center py-12">
            <p className="text-gray-600">
              Viewer profile content will be rendered here.
            </p>
          </div>
        )}

        {/* Toast Notifications */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      </div>
    </Layout>
  );
}
