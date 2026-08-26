import React from "react";
import { cn } from "@/lib/utils";
import { RiskTier } from "@/lib/types";

type BadgeType = "estimated" | "self-reported" | "risk" | "outline";

interface DataBadgeProps {
  type: BadgeType;
  riskTier?: RiskTier;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function DataBadge({ type, riskTier, children, className, icon }: DataBadgeProps) {
  const getBadgeStyles = () => {
    switch (type) {
      case "estimated":
        return "bg-bg-tertiary text-text-secondary border-border-default";
      case "self-reported":
        return "bg-community-subtle text-community-text border-community-border";
      case "risk":
        if (!riskTier) return "bg-gray-100 text-gray-800";
        switch (riskTier) {
          case "low":
            return "bg-risk-bg-low text-risk-low border-risk-bg-low";
          case "moderate":
            return "bg-risk-bg-moderate text-risk-moderate border-risk-bg-moderate";
          case "high":
            return "bg-risk-bg-high text-risk-high border-risk-bg-high";
          case "very_high":
            return "bg-risk-bg-very-high text-risk-very-high border-risk-bg-very-high";
        }
      case "outline":
        return "bg-transparent border-border-default text-text-secondary";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        getBadgeStyles(),
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
