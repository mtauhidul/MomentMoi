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

  useEffect(() => {
    fetchFeaturedVendors();
  }, [limit]);

  const fetchFeaturedVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClientComponentClient();

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
    } catch (err) {
      console.error("Error fetching featured vendors:", err);
      setError("Failed to load featured vendors");
    } finally {
      setLoading(false);
    }
  };

  return { vendors, loading, error, refetch: fetchFeaturedVendors };
}
