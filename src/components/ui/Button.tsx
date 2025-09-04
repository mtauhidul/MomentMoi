import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "stacked"
    | "stacked-outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      asChild,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      variant === "stacked" || variant === "stacked-outline"
        ? "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        : "inline-flex items-center justify-center rounded-[100px] font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";

    const variants = {
      primary:
        "bg-primary-500 text-white hover:bg-primary-600 shadow-soft hover:shadow-medium",
      secondary:
        "bg-secondary-500 text-white hover:bg-secondary-600 shadow-soft hover:shadow-medium",
      outline:
        "border-2 border-primary-500 text-primary-500 hover:bg-primary-50",
      ghost: "text-primary-500 hover:bg-primary-50",
      destructive:
        "bg-red-500 text-white hover:bg-red-600 shadow-soft hover:shadow-medium",
      stacked:
        "bg-primary-500 text-white hover:bg-primary-600 shadow-soft hover:shadow-medium",
      "stacked-outline":
        "border-2 border-primary-500 text-primary-500 hover:bg-primary-50",
    };

    const sizes = {
      sm: "px-4 py-[0.35rem] text-sm",
      md: "px-5 py-[0.45rem] text-base",
      lg: "px-6 py-[0.65rem] text-lg",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
