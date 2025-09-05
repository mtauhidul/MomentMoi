"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

interface InstantNavigationState {
  isNavigating: boolean;
  targetPath: string | null;
}

let navigationState: InstantNavigationState = {
  isNavigating: false,
  targetPath: null,
};

const navigationListeners = new Set<(state: InstantNavigationState) => void>();

// Global navigation state manager
export const navigationManager = {
  subscribe: (listener: (state: InstantNavigationState) => void) => {
    navigationListeners.add(listener);
    return () => navigationListeners.delete(listener);
  },

  getState: () => navigationState,

  startNavigation: (path: string) => {
    navigationState = { isNavigating: true, targetPath: path };
    navigationListeners.forEach(listener => listener(navigationState));
  },

  finishNavigation: () => {
    navigationState = { isNavigating: false, targetPath: null };
    navigationListeners.forEach(listener => listener(navigationState));
  },
};

export function useInstantNavigation() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  // Complete navigation state - use useCallback with empty deps
  const completeNavigation = useCallback(() => {
    setIsNavigating(false);
    setTargetPath(null);
    
    // Dispatch completion event
    const event = new CustomEvent('navigation:complete');
    window.dispatchEvent(event);
  }, []); // Empty dependency array to prevent infinite loops

  // Listen for route changes to auto-complete navigation
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      // Small delay to ensure the page is rendered
      setTimeout(() => {
        setIsNavigating(false);
        setTargetPath(null);
        
        // Dispatch completion event
        const event = new CustomEvent('navigation:complete');
        window.dispatchEvent(event);
      }, 100);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChangeComplete);
    
    // Listen for our own completion trigger
    window.addEventListener('navigation:complete', handleRouteChangeComplete);

    return () => {
      window.removeEventListener('popstate', handleRouteChangeComplete);
      window.removeEventListener('navigation:complete', handleRouteChangeComplete);
    };
  }, []); // Empty dependency array to prevent re-registration

  const navigateInstantly = useCallback(async (path: string) => {
    // Set immediate loading state
    setIsNavigating(true);
    setTargetPath(path);
    
    // Dispatch start event for UI feedback
    const startEvent = new CustomEvent('navigation:start', { 
      detail: { path } 
    });
    window.dispatchEvent(startEvent);

    try {
      // Prefetch the route first for better performance
      await router.prefetch(path);
      
      // Navigate
      router.push(path);
      
      // Auto-complete after a timeout as fallback
      setTimeout(() => {
        setIsNavigating(false);
        setTargetPath(null);
        
        // Dispatch completion event
        const event = new CustomEvent('navigation:complete');
        window.dispatchEvent(event);
      }, 3000);
      
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
      setTargetPath(null);
    }
  }, [router]);

  return {
    navigateInstantly,
    completeNavigation,
    isNavigating,
    targetPath,
  };
}

// Hook for target pages to finish navigation
export function useNavigationComplete() {
  useEffect(() => {
    navigationManager.finishNavigation();
  }, []);
}
