"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for slide-out animation
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: "text-green-600",
      closeButton: "text-green-400 hover:text-green-600",
    },
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: "text-red-600",
      closeButton: "text-red-400 hover:text-red-600",
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-out",
        isAnimating ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm",
          currentStyle.container
        )}
      >
        {type === "success" ? (
          <CheckCircle className={cn("w-5 h-5 flex-shrink-0", currentStyle.icon)} />
        ) : (
          <XCircle className={cn("w-5 h-5 flex-shrink-0", currentStyle.icon)} />
        )}
        
        <span className="text-sm font-medium flex-1">{message}</span>
        
        <button
          onClick={() => {
            setIsAnimating(false);
            setTimeout(onClose, 300);
          }}
          className={cn(
            "p-1 rounded-full hover:bg-black/5 transition-colors",
            currentStyle.closeButton
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
