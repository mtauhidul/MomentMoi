import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = "md", className, ...props }, ref) => {
    const LucideIcon = LucideIcons[name] as React.ComponentType<
      React.SVGProps<SVGSVGElement>
    >;

    if (!LucideIcon) {
      console.warn(`Icon "${name}" not found in Lucide React`);
      return null;
    }

    const sizes = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-8 h-8",
    };

    return (
      <LucideIcon ref={ref} className={cn(sizes[size], className)} {...props} />
    );
  }
);

Icon.displayName = "Icon";

export { Icon };
export type { IconProps };
