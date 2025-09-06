"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";

interface FeaturedVendor {
  id: string;
  slug: string | null;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  business_category: string;
  event_types: string[];
  profile_views: number;
  created_at: string;
}

export function useFeaturedVendors(limit: number = 9) {
  const [vendors, setVendors] = useState<FeaturedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchFeaturedVendors();
  }, [limit]);

  // Retry logic: if vendors are empty and we're not loading, retry after 2 seconds
  useEffect(() => {
    if (!loading && vendors.length === 0 && retryCount < 3 && !error) {
      const timer = setTimeout(() => {
        console.log(`Retrying featured vendors fetch (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        fetchFeaturedVendors();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, vendors.length, retryCount, error]);

  const fetchFeaturedVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClientComponentClient();
      
      // Check if Supabase client is available
      if (!supabase) {
        console.error("Supabase client not available, will retry...");
        setError(retryCount >= 2 ? "Service temporarily unavailable" : null);
        setVendors([]);
        return;
      }

      // Fetch verified vendors first, then all vendors, limited to the specified number
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .order("verified", { ascending: false })
        .order("profile_views", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      setVendors(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching featured vendors:", err);
      setError("Failed to load featured vendors");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  return { vendors, loading, error, refetch: fetchFeaturedVendors };
}
