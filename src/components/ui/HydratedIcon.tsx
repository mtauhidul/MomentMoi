"use client";

import { Camera as LucideCamera } from "lucide-react";

interface CameraIconProps {
  className?: string;
  size?: number;
}

// Create a specific Camera icon component to ensure consistent SSR/client rendering
export function CameraIcon({ className, size }: CameraIconProps) {
  return <LucideCamera className={className} size={size} />;
}
