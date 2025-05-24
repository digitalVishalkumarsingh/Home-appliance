
"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { FaSpinner } from "react-icons/fa";
import { cn } from "@/app/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  toggleSwitch?: boolean; // New prop for toggle switch (used in AvailabilityToggle)
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      toggleSwitch = false,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-md";

    // Variant styles (no hover or focus effects)
    const variantStyles = {
      primary: "bg-blue-600 text-white border border-transparent",
      secondary: "bg-gray-200 text-gray-800 border border-transparent",
      outline: "bg-transparent text-gray-700 border border-gray-300",
      ghost: "bg-transparent text-gray-700 border border-transparent",
      danger: "bg-red-600 text-white border border-transparent",
      success: "bg-green-600 text-white border border-transparent",
    };

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    // Disabled styles
    const disabledStyles = "opacity-50 cursor-not-allowed";

    // Full width style
    const widthStyle = fullWidth ? "w-full" : "";

    // Toggle switch styles (for AvailabilityToggle)
    const toggleSwitchStyles = toggleSwitch
      ? "flex items-center space-x-2 rounded-full px-4 py-2 shadow-sm"
      : "";

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          (disabled || isLoading) && disabledStyles,
          widthStyle,
          toggleSwitchStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2 -ml-1 h-4 w-4" />
            {loadingText || children}
          </>
        ) : toggleSwitch ? (
          <>
            <div className="relative w-12 h-6">
              <div
                className={`absolute inset-0 rounded-full ${
                  variant === "success" ? "bg-green-300" : "bg-red-300"
                }`}
              ></div>
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  variant === "success" ? "translate-x-6" : "translate-x-0.5"
                }`}
              ></div>
            </div>
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;