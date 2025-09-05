"use client";

import { useEffect, useState } from "react";

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Show loading on route change start
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
    };

    // Hide loading on route change complete or error
    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
    };

    // Listen for navigation events
    const handleBeforeUnload = () => {
      setIsNavigating(true);
    };

    const handleLoad = () => {
      setIsNavigating(false);
    };

    // Use a more reliable approach with navigation API
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("load", handleLoad);

      // Custom event for navigation start
      window.addEventListener("navigation-start", handleRouteChangeStart);
      window.addEventListener("navigation-complete", handleRouteChangeComplete);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("load", handleLoad);
        window.removeEventListener("navigation-start", handleRouteChangeStart);
        window.removeEventListener("navigation-complete", handleRouteChangeComplete);
      }
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gray-200">
      <div 
        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse"
        style={{
          animation: "progress 1s ease-in-out infinite",
        }}
      ></div>
      <style jsx>{`
        @keyframes progress {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(0.6); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}
