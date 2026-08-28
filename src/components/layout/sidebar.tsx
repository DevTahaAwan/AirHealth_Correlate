"use client";

import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistrictListItem, RiskTier } from "@/lib/types";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { DataBadge } from "@/components/ui/data-badge";

interface SidebarProps {
  onDistrictSelect: (id: string) => void;
  selectedDistrictId: string | null;
}

export function Sidebar({ onDistrictSelect, selectedDistrictId }: SidebarProps) {
  const [districts, setDistricts] = useState<DistrictListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDistricts() {
      try {
        const res = await fetch("/api/v1/districts");
        const json = await res.json();
        if (json.success) {
          // Sort by highest risk first, then by name
          const sorted = [...json.data].sort((a, b) => {
            const riskWeight: Record<RiskTier, number> = {
              very_high: 4,
              high: 3,
              moderate: 2,
              low: 1,
            };
            const riskA = riskWeight[a.risk_tier as RiskTier] || 0;
            const riskB = riskWeight[b.risk_tier as RiskTier] || 0;
            if (riskA !== riskB) return riskB - riskA;
            return a.name.localeCompare(b.name);
          });
          setDistricts(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch districts for sidebar", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDistricts();
  }, []);

  return (
    <aside className="w-full md:w-sidebar flex-shrink-0 bg-bg-secondary border-r border-border-default h-[calc(100vh-var(--nav-height))] overflow-y-auto hidden md:block">
      <div className="p-4 border-b border-border-subtle sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10">
        <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
          Lahore Districts
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3">
              <SkeletonLoader variant="title" className="mb-2 w-1/2" />
              <SkeletonLoader variant="text" className="w-1/3" />
            </div>
          ))
        ) : !districts || districts.length === 0 ? (
          // Fix 2: Defensive empty-state — shown when DB has no AQI data yet
          <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
              <Activity className="h-5 w-5 text-text-tertiary" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              No district data available yet.
              <br />
              Waiting for sensor sync&hellip;
            </p>
          </div>
        ) : (
          districts.map((district) => {
            const isActive = selectedDistrictId === district.district_id;
            const isSurge = district.risk_tier === "very_high";

            return (
              <div
                key={district.district_id}
                onClick={() => onDistrictSelect(district.district_id)}
                className={cn(
                  "block p-3 rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-brand-subtle"
                    : "hover:bg-bg-tertiary",
                  isSurge && !isActive && "border border-surge-subtle bg-surge-subtle/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "font-medium truncate pr-2",
                    isActive ? "text-brand-active" : "text-text-primary",
                    isSurge && !isActive && "text-surge-title"
                  )}>
                    {district.name}
                  </span>
                  <DataBadge type="risk" riskTier={district.risk_tier || "low"}>
                    {/* Fix 2: Guard null AQI in badge */}
                    {district.aqi ?? "--"} AQI
                  </DataBadge>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary mt-2">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-community" />
                    {district.symptom_reports_today ?? 0} Reports
                  </span>
                  {isSurge && (
                    <span className="flex items-center gap-1 text-surge">
                      <AlertTriangle className="h-3 w-3" />
                      Surge Alert
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
