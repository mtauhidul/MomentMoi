"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoutePreloaderProps {
  routes: string[];
  priority?: "high" | "low";
}

export function RoutePreloader({ routes, priority = "low" }: RoutePreloaderProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadRoutes = () => {
      routes.forEach((route) => {
        // Use router.prefetch to preload the route
        router.prefetch(route);
      });
    };

    if (priority === "high") {
      // Preload immediately for high priority
      preloadRoutes();
    } else {
      // Use requestIdleCallback for low priority to avoid blocking the main thread
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(preloadRoutes, { timeout: 2000 });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(preloadRoutes, 1000);
      }
    }
  }, [routes, priority, router]);

  return null; // This component doesn't render anything
}

// Common route sets for different user types
export const COMMON_ROUTES = [
  "/dashboard",
  "/dashboard/profile",
  "/favorites",
];

export const VENDOR_ROUTES = [
  "/dashboard/services",
  "/dashboard/calendar",
  "/dashboard/inquiries",
  "/dashboard/gallery",
];

export const PLANNER_ROUTES = [
  "/dashboard/event",
  "/dashboard/budget",
  "/dashboard/checklist",
  "/dashboard/guests",
  "/dashboard/vendors",
];

export const PUBLIC_ROUTES = [
  "/weddings",
  "/christenings", 
  "/parties",
  "/vendors",
  "/vendors/photographers",
  "/vendors/venues",
  "/vendors/catering",
];
