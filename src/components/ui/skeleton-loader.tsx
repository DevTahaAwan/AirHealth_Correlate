import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "title" | "circle" | "card" | "custom";
}

export function SkeletonLoader({ variant = "custom", className, ...props }: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "text":
        return "skeleton-text";
      case "title":
        return "skeleton-title";
      case "circle":
        return "skeleton-circle";
      case "card":
        return "skeleton-card";
      default:
        return "skeleton"; // custom allows defining w/h via className
    }
  };

  return (
    <div
      className={cn(getVariantClass(), className)}
      aria-busy="true"
      aria-hidden="true"
      {...props}
    />
  );
}
