import { createClientComponentClient } from "./supabase";

export async function testRealTimeSubscriptions() {
  const supabase = createClientComponentClient();
  
  console.log("Testing real-time subscriptions...");
  
  try {
    // Test subscription to vendor_inquiries
    const channel = supabase
      .channel("test-inquiries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendor_inquiries",
        },
        (payload) => {
          console.log("Real-time update received:", payload);
        }
      )
      .subscribe();

    console.log("Real-time subscription established successfully");
    
    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log("Real-time subscription cleaned up");
    }, 5000);
    
    return { success: true, message: "Real-time subscription test completed" };
  } catch (error) {
    console.error("Error testing real-time subscriptions:", error);
    return { success: false, error: error };
  }
}

export async function testVendorSpecificSubscription(vendorId: string) {
  const supabase = createClientComponentClient();
  
  console.log(`Testing vendor-specific subscription for vendor: ${vendorId}`);
  
  try {
    const channel = supabase
      .channel(`test-vendor-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendor_inquiries",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          console.log("Vendor-specific real-time update:", payload);
        }
      )
      .subscribe();

    console.log("Vendor-specific subscription established successfully");
    
    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log("Vendor-specific subscription cleaned up");
    }, 5000);
    
    return { success: true, message: "Vendor-specific subscription test completed" };
  } catch (error) {
    console.error("Error testing vendor-specific subscription:", error);
    return { success: false, error: error };
  }
}
