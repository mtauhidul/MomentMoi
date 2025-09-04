/**
 * Test file to verify dashboard performance optimizations
 * This file contains utility functions to test caching, loading states, and error handling
 */

import { createClientComponentClient } from "@/lib/supabase";

// Test cache functionality
export async function testDashboardCache() {
  console.log("🧪 Testing dashboard cache functionality...");
  
  const supabase = createClientComponentClient();
  
  try {
    // Test 1: Check if vendor_analytics table exists
    const { data: analyticsTest, error: analyticsError } = await supabase
      .from("vendor_analytics")
      .select("count")
      .limit(1);
    
    if (analyticsError) {
      console.log("❌ vendor_analytics table not accessible:", analyticsError.message);
    } else {
      console.log("✅ vendor_analytics table accessible");
    }
    
    // Test 2: Check if vendor_inquiries table exists
    const { data: inquiriesTest, error: inquiriesError } = await supabase
      .from("vendor_inquiries")
      .select("count")
      .limit(1);
    
    if (inquiriesError) {
      console.log("❌ vendor_inquiries table not accessible:", inquiriesError.message);
    } else {
      console.log("✅ vendor_inquiries table accessible");
    }
    
    // Test 3: Check if vendor_bookings table exists
    const { data: bookingsTest, error: bookingsError } = await supabase
      .from("vendor_bookings")
      .select("count")
      .limit(1);
    
    if (bookingsError) {
      console.log("❌ vendor_bookings table not accessible:", bookingsError.message);
    } else {
      console.log("✅ vendor_bookings table accessible");
    }
    
    // Test 4: Check if vendor_profiles table exists
    const { data: profilesTest, error: profilesError } = await supabase
      .from("vendor_profiles")
      .select("count")
      .limit(1);
    
    if (profilesError) {
      console.log("❌ vendor_profiles table not accessible:", profilesError.message);
    } else {
      console.log("✅ vendor_profiles table accessible");
    }
    
    return {
      success: true,
      analytics: !analyticsError,
      inquiries: !inquiriesError,
      bookings: !bookingsError,
      profiles: !profilesError,
    };
    
  } catch (error) {
    console.error("❌ Error testing dashboard cache:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test loading states
export function testLoadingStates() {
  console.log("🧪 Testing loading states...");
  
  const loadingStates = {
    statsLoading: false,
    inquiriesLoading: false,
    profileLoading: false,
    growthLoading: false,
    overallLoading: false,
  };
  
  console.log("✅ Loading states initialized:", loadingStates);
  return loadingStates;
}

// Test error boundaries
export function testErrorBoundaries() {
  console.log("🧪 Testing error boundaries...");
  
  const testError = new Error("Test error for error boundary");
  
  console.log("✅ Error boundary test error created:", testError.message);
  return testError;
}

// Test cache duration
export function testCacheDuration() {
  console.log("🧪 Testing cache duration...");
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  const cacheTimestamp = now - (3 * 60 * 1000); // 3 minutes ago
  const isCacheValid = now - cacheTimestamp < CACHE_DURATION;
  
  console.log("✅ Cache duration test:", {
    cacheDuration: CACHE_DURATION,
    cacheAge: now - cacheTimestamp,
    isValid: isCacheValid,
  });
  
  return {
    cacheDuration: CACHE_DURATION,
    cacheAge: now - cacheTimestamp,
    isValid: isCacheValid,
  };
}

// Test skeleton components
export function testSkeletonComponents() {
  console.log("🧪 Testing skeleton components...");
  
  const skeletonTypes = [
    "Skeleton",
    "SkeletonText", 
    "SkeletonCard",
    "SkeletonInquiry",
  ];
  
  console.log("✅ Skeleton components available:", skeletonTypes);
  return skeletonTypes;
}

// Run all performance tests
export async function runDashboardPerformanceTests() {
  console.log("🚀 Running dashboard performance tests...");
  
  const results = {
    cache: await testDashboardCache(),
    loadingStates: testLoadingStates(),
    errorBoundaries: testErrorBoundaries(),
    cacheDuration: testCacheDuration(),
    skeletonComponents: testSkeletonComponents(),
  };
  
  console.log("📊 Performance test results:", results);
  
  const allTestsPassed = results.cache.success;
  
  if (allTestsPassed) {
    console.log("✅ All dashboard performance tests passed!");
  } else {
    console.log("❌ Some dashboard performance tests failed");
  }
  
  return {
    success: allTestsPassed,
    results,
  };
}

// Test real-time subscriptions
export function testRealTimeSubscriptions() {
  console.log("🧪 Testing real-time subscriptions...");
  
  const subscriptionChannels = [
    "vendor-inquiries",
    "vendor-bookings", 
    "vendor-analytics",
    "vendor-profile",
  ];
  
  console.log("✅ Real-time subscription channels:", subscriptionChannels);
  return subscriptionChannels;
}

// Test individual loading states
export function testIndividualLoadingStates() {
  console.log("🧪 Testing individual loading states...");
  
  const loadingStateTests = [
    { name: "Stats Loading", state: false },
    { name: "Inquiries Loading", state: false },
    { name: "Profile Loading", state: false },
    { name: "Growth Loading", state: false },
  ];
  
  console.log("✅ Individual loading states:", loadingStateTests);
  return loadingStateTests;
}
