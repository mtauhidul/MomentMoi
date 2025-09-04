/**
 * Test file for vendor dashboard error handling
 * 
 * This file contains utility functions to test the vendor dashboard
 * error handling for non-vendor users.
 */

import { createClientComponentClient } from "./supabase";

export interface TestResult {
  success: boolean;
  error?: string;
  details?: any;
}

/**
 * Test vendor dashboard error handling for non-vendor user
 */
export async function testVendorDashboardErrorHandling(userId: string): Promise<TestResult> {
  try {
    const supabase = createClientComponentClient();
    
    // First, check if user exists and get their user type
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      return {
        success: false,
        error: `Failed to get user profile: ${profileError.message}`,
        details: profileError
      };
    }
    
    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found",
        details: { userId }
      };
    }
    
    // Check if user is a vendor
    if (userProfile.user_type === 'vendor') {
      // Try to get vendor profile
      const { data: vendorProfile, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (vendorError) {
        return {
          success: false,
          error: `Vendor profile error: ${vendorError.message}`,
          details: { userType: userProfile.user_type, vendorError }
        };
      }
      
      if (!vendorProfile) {
        return {
          success: false,
          error: "User is marked as vendor but no vendor profile exists",
          details: { userType: userProfile.user_type, userId }
        };
      }
      
      return {
        success: true,
        details: { 
          userType: userProfile.user_type, 
          vendorId: vendorProfile.id,
          message: "User is a valid vendor"
        }
      };
    } else {
      // User is not a vendor - this is the expected case for error testing
      const { data: vendorProfile, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (vendorError && vendorError.code === 'PGRST116') {
        // This is the expected error - no vendor profile found
        return {
          success: true,
          details: { 
            userType: userProfile.user_type, 
            expectedError: "No vendor profile found for non-vendor user",
            vendorError: vendorError.message
          }
        };
      }
      
      if (vendorProfile) {
        return {
          success: false,
          error: "Non-vendor user has a vendor profile (unexpected)",
          details: { userType: userProfile.user_type, vendorId: vendorProfile.id }
        };
      }
      
      return {
        success: true,
        details: { 
          userType: userProfile.user_type, 
          message: "Non-vendor user correctly has no vendor profile"
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Test failed with exception: ${error}`,
      details: error
    };
  }
}

/**
 * Test the complete vendor dashboard initialization flow
 */
export async function testVendorDashboardInitialization(userId: string): Promise<TestResult> {
  try {
    const supabase = createClientComponentClient();
    
    // Simulate the getVendorId function logic
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    
    if (userProfileError) {
      return {
        success: false,
        error: `User profile error: ${userProfileError.message}`,
        details: userProfileError
      };
    }
    
    if (!userProfile) {
      return {
        success: false,
        error: "No user profile found",
        details: { userId }
      };
    }
    
    if (userProfile.user_type !== 'vendor') {
      return {
        success: true,
        details: { 
          userType: userProfile.user_type,
          message: "Correctly identified non-vendor user",
          expectedBehavior: "Should show vendor profile not found error"
        }
      };
    }
    
    // User is a vendor, try to get vendor profile
    const { data: vendorProfile, error: profileError } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (profileError) {
      return {
        success: false,
        error: `Vendor profile error: ${profileError.message}`,
        details: { userType: userProfile.user_type, profileError }
      };
    }
    
    if (!vendorProfile) {
      return {
        success: false,
        error: "Vendor user has no vendor profile",
        details: { userType: userProfile.user_type, userId }
      };
    }
    
    return {
      success: true,
      details: { 
        userType: userProfile.user_type,
        vendorId: vendorProfile.id,
        message: "Vendor user correctly has vendor profile"
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Initialization test failed: ${error}`,
      details: error
    };
  }
}
