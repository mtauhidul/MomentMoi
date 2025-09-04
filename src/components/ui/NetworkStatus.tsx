"use client";

import { useServiceWorker } from "@/components/providers/ServiceWorkerProvider";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function NetworkStatus() {
  const { isOnline, updateAvailable, refreshApp } = useServiceWorker();

  if (isOnline && !updateAvailable) {
    return null; // Don't show anything when everything is normal
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-orange-800">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Some features may be limited
          </p>
        </div>
      )}

      {updateAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Update available</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Refresh for the latest version
          </p>
          <Button
            size="sm"
            onClick={refreshApp}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
