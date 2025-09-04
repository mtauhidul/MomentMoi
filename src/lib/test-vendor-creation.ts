import { createClientComponentClient } from './supabase'

export async function debugUserProfile(userId?: string) {
  const supabase = createClientComponentClient();

  try {
    // If no userId provided, get current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        return { error: "No authenticated user found" };
      }
      userId = user.id;
    }

    console.log("🔍 Debug: Checking user profile for:", userId);

    // Get user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    console.log("🔍 Debug: Auth user data:", { authUser, authError });

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("🔍 Debug: Profile data:", { profile, profileError });

    // Get vendor profile if exists
    const { data: vendorProfile, error: vendorError } = await supabase
      .from("vendor_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    console.log("🔍 Debug: Vendor profile data:", { vendorProfile, vendorError });

    return {
      userId,
      authUser: authUser?.user,
      profile,
      vendorProfile,
      errors: {
        auth: authError,
        profile: profileError,
        vendor: vendorError
      }
    };
  } catch (error) {
    console.error("💥 Debug: Error checking user profile:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function testVendorCreation() {
  const supabase = createClientComponentClient()
  
  try {

    
    // Test 1: Check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('Database connection test failed:', testError)
      return { success: false, error: testError }
    }
    

    
    // Test 2: Check vendor_profiles table structure
    const { data: vendorTableInfo, error: vendorTableError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .limit(0)
    
    if (vendorTableError) {
      console.error('Vendor profiles table test failed:', vendorTableError)
      return { success: false, error: vendorTableError }
    }
    

    
    // Test 3: Check vendor_contacts table structure
    const { data: contactsTableInfo, error: contactsTableError } = await supabase
      .from('vendor_contacts')
      .select('*')
      .limit(0)
    
    if (contactsTableError) {
      console.error('Vendor contacts table test failed:', contactsTableError)
      return { success: false, error: contactsTableError }
    }
    

    
    // Test 4: Check vendor_locations table structure
    const { data: locationsTableInfo, error: locationsTableError } = await supabase
      .from('vendor_locations')
      .select('*')
      .limit(0)
    
    if (locationsTableError) {
      console.error('Vendor locations table test failed:', locationsTableError)
      return { success: false, error: locationsTableError }
    }
    

    
    return { success: true }
    
  } catch (error) {
    console.error('Test failed with exception:', error)
    return { success: false, error }
  }
}
