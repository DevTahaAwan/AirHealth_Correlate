import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { SurgeFlagItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SurgeAdvisoryBannerProps {
  flags: SurgeFlagItem[];
  onActionClick?: (districtId: string) => void;
  className?: string;
}

export function SurgeAdvisoryBanner({ flags, onActionClick, className }: SurgeAdvisoryBannerProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full bg-surge-subtle border-l-4 border-surge p-4 shadow-surge rounded-r-md animate-fade-in",
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-surge" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-surge-title">
              Surge Advisory Active
            </h3>
            <p className="mt-1 text-sm text-surge-text">
              High risk of respiratory hospital admissions in{" "}
              <span className="font-semibold">
                {flags.map((f) => f.district_name).join(", ")}
              </span>{" "}
              within the next 24-48 hours due to extreme AQI.
            </p>
          </div>
          {onActionClick && (
            <p className="mt-3 text-sm md:mt-0 md:ml-6 flex-shrink-0">
              <button
                onClick={() => onActionClick(flags[0].district_id)}
                className="inline-flex items-center gap-1 font-medium text-surge hover:text-surge-title transition-colors focus:outline-none focus:underline"
              >
                View Evidence Map
                <ChevronRight className="h-4 w-4" />
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
