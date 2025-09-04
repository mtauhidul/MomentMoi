import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient, supabase } from "@/lib/supabase";

interface VendorProfile {
  id: string;
  user_id: string;
  slug: string | null;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  business_category: string;
  event_types: string[];
  created_at: string;
  updated_at: string;
}

interface VendorContact {
  id: string;
  vendor_id: string;
  contact_type: "email" | "phone";
  contact_value: string;
  is_primary: boolean;
  created_at: string;
}

interface VendorLocation {
  id: string;
  vendor_id: string;
  location: string;
  created_at: string;
}

interface UseVendorProfileReturn {
  profile: VendorProfile | null;
  contacts: VendorContact[];
  locations: VendorLocation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveProfile: (data: {
    business_name: string;
    description: string;
    business_category: string;
    event_types: string[];
    contacts: Array<{
      contact_type: "email" | "phone";
      contact_value: string;
      is_primary: boolean;
    }>;
    locations: string[];
  }) => Promise<{ success: boolean; error?: string }>;
}

export function useVendorProfile(): UseVendorProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First check if user is a vendor by querying their profile
      const supabase = createClientComponentClient();
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (userProfileError) {
        console.error("Error fetching user profile:", userProfileError);
        setError("Failed to verify user type");
        setLoading(false);
        return;
      }

      // Only proceed if user is a vendor
      if (userProfile.user_type !== "vendor") {
        console.log("User is not a vendor, skipping vendor profile fetch");
        setProfile(null);
        setContacts([]);
        setLocations([]);
        setLoading(false);
        return;
      }

      // Now fetch vendor profile with retry logic for timing issues
    let profileData = null;
    let vendorProfileError: any = null;
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      profileData = data;
      vendorProfileError = error;

      if (vendorProfileError) {
        console.error(`Error fetching vendor profile (attempt ${attempt}/${maxRetries}):`, vendorProfileError);

        // If vendor profile doesn't exist, that's expected for new vendors
        if (vendorProfileError.code === 'PGRST116') {
          console.log("Vendor profile doesn't exist yet - this is normal for new vendors");
          setProfile(null);
          setContacts([]);
          setLocations([]);
          setError(null);
          setLoading(false);
          return;
        }

        // If this is a 406 error and we have retries left, wait and try again
        if (vendorProfileError.message?.includes('406') && attempt < maxRetries) {
          console.log(`Received 406 error, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // If we've exhausted retries or it's a different error, break
        break;
      } else {
        // Success, break out of retry loop
        break;
      }
    }

    if (vendorProfileError) {
      console.error("Final error fetching vendor profile:", JSON.stringify(vendorProfileError, null, 2));
      setError("Failed to load profile data. Please try refreshing the page.");
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Fetch vendor contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from("vendor_contacts")
      .select("*")
      .eq("vendor_id", profileData.id)
      .order("is_primary", { ascending: false });

    if (contactsError) {
      console.error("Error fetching vendor contacts:", contactsError);
    } else {
      setContacts(contactsData || []);
    }

    // Fetch vendor locations
    const { data: locationsData, error: locationsError } = await supabase
      .from("vendor_locations")
      .select("*")
      .eq("vendor_id", profileData.id);

    if (locationsError) {
      console.error("Error fetching vendor locations:", locationsError);
    } else {
      setLocations(locationsData || []);
    }
  } catch (err) {
    console.error("Error in fetchProfile:", err);
    setError("An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};

  const saveProfile = async (data: {
    business_name: string;
    description: string;
    business_category: string;
    event_types: string[];
    logo_url?: string | null;
    contacts: Array<{
      contact_type: "email" | "phone";
      contact_value: string;
      is_primary: boolean;
    }>;
    locations: string[];
  }) => {
    if (!user) {
      return { success: false, error: "No user found" };
    }

    try {
      const supabase = createClientComponentClient();

      let vendorProfileId: string;

      if (!profile) {
        // No profile exists, create one
        console.log("No vendor profile found, creating new one...");

        // Generate unique slug for the vendor
        let slug: string | undefined;
        try {
          const { generateUniqueSlug } = await import("@/lib/slug-utils");
          slug = await generateUniqueSlug(data.business_name);
        } catch (slugError) {
          console.warn('Failed to generate slug, creating vendor without slug:', slugError);
          // Continue without slug - it will use ID for routing
        }

        const { data: newProfile, error: createError } = await supabase
          .from("vendor_profiles")
          .insert({
            user_id: user.id,
            business_name: data.business_name,
            ...(slug && { slug }),
            description: data.description,
            business_category: data.business_category as any,
            event_types: data.event_types as any,
            logo_url: data.logo_url,
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create vendor profile:", createError);
          return { success: false, error: "Failed to create profile" };
        }

        vendorProfileId = newProfile.id;
        console.log("Vendor profile created with ID:", vendorProfileId);
      } else {
        // Profile exists, update it
        vendorProfileId = profile.id;

        console.log("Updating existing vendor profile...");

        // Check if business name changed and regenerate slug if needed
        let updateData: any = {
          business_name: data.business_name,
          description: data.description,
          business_category: data.business_category as any,
          event_types: data.event_types as any,
          logo_url: data.logo_url,
          updated_at: new Date().toISOString(),
        };

        if (profile.business_name !== data.business_name) {
          // Business name changed, regenerate slug
          try {
            const { generateUniqueSlug } = await import("@/lib/slug-utils");
            const newSlug = await generateUniqueSlug(data.business_name, profile.slug || undefined);
            updateData.slug = newSlug;
            console.log(`Business name changed, regenerating slug: ${newSlug}`);
          } catch (slugError) {
            console.warn('Failed to regenerate slug, keeping existing slug:', slugError);
            // Keep existing slug or don't update it
          }
        }

        const { data: updateResult, error: profileError } = await supabase
          .from("vendor_profiles")
          .update(updateData)
          .eq("id", profile.id)
          .select();

        if (profileError) {
          return { success: false, error: "Failed to update profile" };
        }
      }

      console.log("🗑️ Deleting existing contacts and locations...");
      
      // Delete contacts first (only if profile existed before)
      if (profile) {
        const { error: deleteContactsError } = await supabase
          .from("vendor_contacts")
          .delete()
          .eq("vendor_id", profile.id);

        console.log("📞 Contacts delete error:", deleteContactsError);

        if (deleteContactsError) {
          console.log("❌ Failed to delete contacts:", deleteContactsError);
          return { success: false, error: "Failed to delete existing contacts" };
        }

        console.log("✅ Contacts deleted successfully");
        
        // Delete locations
        const { error: deleteLocationsError } = await supabase
          .from("vendor_locations")
          .delete()
          .eq("vendor_id", profile.id);

        console.log("📍 Locations delete error:", deleteLocationsError);

        if (deleteLocationsError) {
          console.log("❌ Failed to delete locations:", deleteLocationsError);
          return { success: false, error: "Failed to delete existing locations" };
        }

        console.log("✅ Locations deleted successfully");
      }

      console.log("📞 Inserting new contacts...");
      
      // Insert new contacts
      if (data.contacts.length > 0) {
        console.log("📋 Contacts to insert:", data.contacts);
        
        const { error: contactsError } = await supabase
          .from("vendor_contacts")
          .insert(
            data.contacts.map((contact) => ({
              vendor_id: vendorProfileId,
              contact_type: contact.contact_type,
              contact_value: contact.contact_value,
              is_primary: contact.is_primary,
            }))
          );

        console.log("📞 Contacts insert error:", contactsError);

        if (contactsError) {
          console.log("❌ Failed to insert contacts:", contactsError);
          return { success: false, error: "Failed to update contacts" };
        }

        console.log("✅ Contacts inserted successfully");
      } else {
        console.log("ℹ️ No contacts to insert");
      }

      console.log("📍 Inserting new locations...");
      
      // Insert new locations
      if (data.locations.length > 0) {
        console.log("🗺️ Locations to insert:", data.locations);
        
        // Validate location values
        const validLocations = [
          "nicosia", "limassol", "larnaca", "paphos", 
          "platres", "paralimni_ayia_napa", "whole_cyprus"
        ];
        
        const invalidLocations = data.locations.filter(
          location => !validLocations.includes(location)
        );
        
        if (invalidLocations.length > 0) {
          console.log("❌ Invalid location values:", invalidLocations);
          return { success: false, error: `Invalid location values: ${invalidLocations.join(", ")}` };
        }
        
        const locationData = data.locations.map((location) => ({
          vendor_id: vendorProfileId,
          location: location,
        }));
  
        console.log("🗺️ Location data to insert:", locationData);
        
        const { data: insertedLocations, error: locationsError } = await supabase
          .from("vendor_locations")
          .insert(locationData)
          .select();

        console.log("📍 Locations insert error:", locationsError);
        console.log("📍 Inserted locations:", insertedLocations);

        if (locationsError) {
          console.log("❌ Failed to insert locations:", locationsError);
          return { success: false, error: "Failed to update locations" };
        }
        
        console.log("✅ Locations inserted successfully");
      } else {
        console.log("ℹ️ No locations to insert");
      }

      console.log("🎉 Profile save completed successfully!");
      return { success: true };
    } catch (err) {
      console.log("💥 Exception in saveProfile:", err);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    contacts,
    locations,
    loading,
    error,
    refetch: fetchProfile,
    saveProfile,
  };
}
