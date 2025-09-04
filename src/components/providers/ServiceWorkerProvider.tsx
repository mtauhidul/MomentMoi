"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  registerServiceWorker,
  setupNetworkListeners,
  isOnline,
} from "@/lib/serviceWorker";

interface ServiceWorkerContextType {
  isOnline: boolean;
  updateAvailable: boolean;
  refreshApp: () => void;
}

const ServiceWorkerContext = createContext<
  ServiceWorkerContextType | undefined
>(undefined);

export function ServiceWorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Setup network listeners
    setupNetworkListeners();

    // Set initial online state
    setIsOnlineState(isOnline());

    // Listen for network events
    const handleOnline = () => setIsOnlineState(true);
    const handleOffline = () => setIsOnlineState(false);

    // Listen for service worker events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      // Could show a toast here using sonner
      console.log("Service worker update available");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("sw-update-available", handleUpdateAvailable);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("sw-update-available", handleUpdateAvailable);
    };
  }, []);

  const refreshApp = () => {
    // Trigger a hard refresh to get the new service worker
    window.location.reload();
  };

  const value: ServiceWorkerContextType = {
    isOnline: isOnlineState,
    updateAvailable,
    refreshApp,
  };

  return (
    <ServiceWorkerContext.Provider value={value}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}

export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext);
  if (context === undefined) {
    throw new Error(
      "useServiceWorker must be used within a ServiceWorkerProvider"
    );
  }
  return context;
}
