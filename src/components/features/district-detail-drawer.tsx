"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Activity, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistrictDetail, SafeTimeResult } from "@/lib/types";
import { DataBadge } from "@/components/ui/data-badge";
import { CorrelationChart } from "./correlation-chart";
import { calculateRespiratoryRisk } from "@/lib/utils/airq-calculator";

interface DistrictDetailDrawerProps {
  district: DistrictDetail | null;
  safeTime: SafeTimeResult | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function DistrictDetailDrawer({
  district,
  safeTime,
  isOpen,
  onClose,
  isLoading,
}: DistrictDetailDrawerProps) {
  if (!isOpen) return null;

  const isSurge = district?.risk_tier === "very_high";
  const respiratoryRisk = district?.pm25 != null ? calculateRespiratoryRisk(district.pm25) : null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg-overlay backdrop-blur-sm transition-opacity" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bg-secondary shadow-elevated border-l border-border-default flex flex-col animate-slide-in-right focus:outline-none",
            isSurge && "border-l-4 border-surge"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
            <Dialog.Title className="text-lg font-bold text-text-primary truncate pr-4">
              {isLoading ? "Loading..." : district?.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 hover:bg-bg-tertiary text-text-secondary transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading || !district ? (
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
                <div className="h-40 bg-gray-200 animate-pulse rounded-md"></div>
                <div className="h-40 bg-gray-200 animate-pulse rounded-md"></div>
              </div>
            ) : (
              <>
                {/* 1. Risk Tier Hero */}
                {district.aqi == null ? (
                  <div className="rounded-xl p-5 bg-slate-500 text-white shadow-sm flex flex-col items-center justify-center py-10">
                    <Activity className="h-8 w-8 animate-pulse mb-3 opacity-70" />
                    <h3 className="text-xl font-bold mb-1">Sensor Data Syncing...</h3>
                    <p className="text-sm opacity-80 text-center">
                      We are currently fetching the latest air quality readings for this district.
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-xl p-5 text-white shadow-sm",
                      district.risk_tier === "low"
                        ? "bg-risk-low"
                        : district.risk_tier === "moderate"
                        ? "bg-risk-moderate"
                        : district.risk_tier === "high"
                        ? "bg-risk-high"
                        : "bg-risk-very-high surge-pulse-gradient"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="uppercase tracking-wider text-xs font-semibold opacity-90">
                        Air Quality Index
                      </span>
                      <DataBadge type="estimated" className="bg-white/20 text-white border-white/10">
                        Measured
                      </DataBadge>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-5xl font-black leading-none tracking-tighter">
                        {district.aqi}
                      </span>
                      <span className="text-lg font-medium opacity-90 mb-1">
                        {(district.risk_tier || "low").replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm opacity-95 leading-relaxed font-medium">
                      {district.advisory_text}
                    </p>
                  </div>
                )}

                {/* Weather Context Badge */}
                {district.rain_expected && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                    <span className="text-xl">🌧️</span>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Weather Context</h4>
                      <p className="text-xs text-blue-800 mt-0.5">Rain Expected: AQI improvements likely.</p>
                    </div>
                  </div>
                )}

                {/* 2. Safe Exposure Time & AirQ+ Risk */}
                <div className="border border-border-default rounded-lg p-4 bg-bg-primary space-y-4">
                  {safeTime && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-brand" />
                        <h3 className="font-semibold text-text-primary">
                          Safe Exposure Time
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-text-primary">
                          {safeTime.safe_minutes >= 999 ? "Unlimited" : `${safeTime.safe_minutes} min`}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {safeTime.basis === "personal_health_profile"
                          ? "Calculated based on your health profile conditions."
                          : "Baseline estimate for general population."}{" "}
                        {safeTime.disclaimer}
                      </p>
                    </div>
                  )}

                  {respiratoryRisk != null && (
                    <div className="pt-4 border-t border-border-subtle">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary">Health Profile Risk</h3>
                        <DataBadge type="estimated" className="text-[10px] bg-brand/10 text-brand border-brand/20">
                          Uses WHO AirQ+ Methodology
                        </DataBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          Estimated Respiratory Risk:
                        </span>
                        <span className="font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded-md">
                          {respiratoryRisk}x higher than baseline
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weather & Smog Context */}
                <div className="border border-border-default rounded-lg p-4 bg-bg-primary">
                  <h3 className="font-semibold text-text-primary mb-3">
                    Live Weather & Smog Context
                  </h3>
                  {!district.weather ? (
                    <div className="flex items-center justify-center p-4 bg-bg-tertiary rounded-md animate-pulse">
                      <span className="text-sm text-text-secondary">Fetching weather context...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          Temperature: <span className="font-normal text-text-secondary">🌡️ {district.weather.temperature}°C</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          Wind: <span className="font-normal text-text-secondary">💨 {district.weather.windSpeed} km/h {district.weather.windSpeed > 10 ? "- Breeze actively dispersing smog" : ""}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          Rain: <span className="font-normal text-text-secondary">🌧️ {district.weather.precipitation}mm expected</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Community Signal (Symptom Summary) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-community" />
                      <h3 className="font-semibold text-text-primary">
                        Community Signal
                      </h3>
                    </div>
                    <DataBadge type="self-reported">Self-Reported</DataBadge>
                  </div>
                  
                  {district.symptom_report_summary.suppressed ? (
                    <div className="bg-bg-tertiary rounded-lg p-4 text-center">
                      <Info className="h-5 w-5 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Data suppressed to protect patient privacy (k-anonymity).
                      </p>
                    </div>
                  ) : (
                    <div className="bg-community-subtle border border-community-border rounded-lg p-4">
                      <div className="mb-4 text-center">
                        <span className="text-3xl font-bold text-community-text">
                          {district.symptom_report_summary.total_today}
                        </span>
                        <p className="text-xs font-medium text-community-text/80 uppercase tracking-wide">
                          Reports Today
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(district.symptom_report_summary.by_symptom)
                          .filter((entry: [string, number]) => entry[1] > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([symptom, count]) => (
                            <div key={symptom} className="flex justify-between items-center text-sm">
                              <span className="text-text-secondary capitalize">
                                {symptom.replace(/_/g, " ")}
                              </span>
                              <span className="font-medium text-text-primary">{count}</span>
                            </div>
                        ))}
                        
                        {district.symptom_report_summary.total_today === 0 && (
                          <p className="text-sm text-text-secondary text-center">
                            No respiratory symptoms reported today.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Correlation Chart */}
                <div className="border border-border-default rounded-lg p-4 bg-bg-primary">
                   <h3 className="font-semibold text-text-primary mb-1">
                      7-Day Trend
                   </h3>
                   <p className="text-xs text-text-secondary mb-4">
                     Correlation between measured AQI and community symptom reports.
                   </p>
                   <div className="h-48 w-full -ml-2">
                     <CorrelationChart districtId={district.district_id} />
                   </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
