import { createClientComponentClient } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/slug-utils";

interface TestResult {
  success: boolean;
  error?: any;
  data?: any;
  step?: string;
}

export async function testVendorOnboardingFlow(userId: string): Promise<TestResult> {
  const supabase = createClientComponentClient();

  try {
    console.log("🧪 Testing vendor onboarding flow...");

    // Step 1: Check if user profile exists
    console.log("Step 1: Checking user profile...");
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return {
        success: false,
        error: profileError,
        step: "user_profile_check"
      };
    }

    console.log("✅ User profile found:", userProfile);

    // Step 2: Test service category lookup
    console.log("Step 2: Testing service category lookup...");
    const { data: serviceCategory, error: categoryError } = await supabase
      .from("service_categories")
      .select("id")
      .eq("category", "photographer")
      .single();

    if (categoryError) {
      console.error("❌ Service category lookup failed:", categoryError);
      return {
        success: false,
        error: categoryError,
        step: "service_category_lookup"
      };
    }

    console.log("✅ Service category found:", serviceCategory);

    // Step 3: Test vendor profile creation
    console.log("Step 3: Testing vendor profile creation...");
    const testBusinessName = `Test Business ${Date.now()}`;

    let slug: string | undefined;
    try {
      const slugResult = await generateUniqueSlug(testBusinessName);
      slug = slugResult;
    } catch (slugError) {
      console.warn("⚠️ Slug generation failed, continuing without slug:", slugError);
    }

    const { data: vendorProfile, error: vendorError } = await supabase
      .from("vendor_profiles")
      .insert({
        user_id: userId,
        business_name: testBusinessName,
        slug,
        description: "Test business description",
        business_category: "photographer",
        event_types: ["wedding", "christening"],
      })
      .select()
      .single();

    if (vendorError) {
      console.error("❌ Vendor profile creation failed:", vendorError);
      return {
        success: false,
        error: vendorError,
        step: "vendor_profile_creation"
      };
    }

    console.log("✅ Vendor profile created:", vendorProfile);

    // Step 4: Test contact creation
    console.log("Step 4: Testing contact creation...");
    const { error: contactError } = await supabase
      .from("vendor_contacts")
      .insert({
        vendor_id: vendorProfile.id,
        contact_type: "email",
        contact_value: "test@example.com",
        is_primary: true,
      });

    if (contactError) {
      console.error("❌ Contact creation failed:", contactError);
      // Clean up
      await supabase.from("vendor_profiles").delete().eq("id", vendorProfile.id);
      return {
        success: false,
        error: contactError,
        step: "contact_creation"
      };
    }

    console.log("✅ Contact created successfully");

    // Step 5: Test service creation
    console.log("Step 5: Testing service creation...");
    const { error: serviceError } = await supabase
      .from("vendor_services")
      .insert({
        vendor_id: vendorProfile.id,
        category_id: serviceCategory.id,
        name: "Test Service",
        description: "Test service description",
        pricing_model: "fixed",
        event_types: ["wedding"],
        is_active: true,
      });

    if (serviceError) {
      console.error("❌ Service creation failed:", serviceError);
      // Clean up
      await supabase.from("vendor_contacts").delete().eq("vendor_id", vendorProfile.id);
      await supabase.from("vendor_profiles").delete().eq("id", vendorProfile.id);
      return {
        success: false,
        error: serviceError,
        step: "service_creation"
      };
    }

    console.log("✅ Service created successfully");

    // Step 6: Test profile update
    console.log("Step 6: Testing profile update...");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Profile update failed:", updateError);
      // Clean up
      await supabase.from("vendor_services").delete().eq("vendor_id", vendorProfile.id);
      await supabase.from("vendor_contacts").delete().eq("vendor_id", vendorProfile.id);
      await supabase.from("vendor_profiles").delete().eq("id", vendorProfile.id);
      return {
        success: false,
        error: updateError,
        step: "profile_update"
      };
    }

    console.log("✅ Profile updated successfully");

    // Step 7: Test dashboard services fetch (what happens after redirect)
    console.log("Step 7: Testing dashboard services fetch...");
    const { data: servicesData, error: servicesError } = await supabase
      .from("vendor_services")
      .select(`
        *,
        category:service_categories(name)
      `)
      .eq("vendor_id", vendorProfile.id)
      .order("created_at", { ascending: false });

    if (servicesError) {
      console.error("❌ Services fetch failed:", servicesError);
      // Clean up
      await supabase.from("vendor_services").delete().eq("vendor_id", vendorProfile.id);
      await supabase.from("vendor_contacts").delete().eq("vendor_id", vendorProfile.id);
      await supabase.from("vendor_profiles").delete().eq("id", vendorProfile.id);
      await supabase.from("profiles").update({ onboarding_completed: false }).eq("id", userId);
      return {
        success: false,
        error: servicesError,
        step: "services_fetch"
      };
    }

    console.log("✅ Services fetch successful:", servicesData);

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await supabase.from("vendor_services").delete().eq("vendor_id", vendorProfile.id);
    await supabase.from("vendor_contacts").delete().eq("vendor_id", vendorProfile.id);
    await supabase.from("vendor_profiles").delete().eq("id", vendorProfile.id);
    await supabase.from("profiles").update({ onboarding_completed: false }).eq("id", userId);

    console.log("🎉 Vendor onboarding flow test completed successfully!");
    return {
      success: true,
      data: {
        userProfile,
        vendorProfile,
        services: servicesData,
      }
    };

  } catch (error) {
    console.error("❌ Unexpected error in vendor onboarding test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      step: "unexpected_error"
    };
  }
}
