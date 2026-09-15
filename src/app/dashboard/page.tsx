"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { DistrictDetail, SafeTimeResult } from "@/lib/types";
import { OutdoorTimer } from "@/components/features/outdoor-timer";
import { SymptomReportModal } from "@/components/features/symptom-report-modal";
import {
  Activity,
  Clock,
  Wind,
  Droplets,
  ShieldAlert,
  CloudRain,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  pm25FromAQI,
  calculateEPA_AQI,
  calculatePM10_AQI,
  calculateCO_AQI,
  calculateSO2_AQI,
  calculateNO2_AQI,
  calculateO3_AQI,
  getAQICategory,
} from "@/lib/utils/epa-aqi";

// ─── Pollutant Card Component (Reused) ───────────────────────────────────────

interface PollutantCardProps {
  name: string;
  value: number | null;
  unit: string;
  subAqi: number | null;
  icon: React.ReactNode;
  accentColor: string;
}

function PollutantCard({ name, value, unit, subAqi, icon, accentColor }: PollutantCardProps) {
  const subAqiLabel = subAqi !== null ? getAQICategory(subAqi).label : null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex flex-col gap-2 hover:shadow-elevated transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg")} style={{ backgroundColor: `${accentColor}15` }}>
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{name}</span>
        </div>
        {subAqi !== null && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${getAQICategory(subAqi).color}20`,
              color: getAQICategory(subAqi).color,
            }}
          >
            AQI {subAqi}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-text-primary tracking-tight">
          {value !== null ? value : "—"}
        </span>
        <span className="text-xs text-text-tertiary">{value !== null ? unit : "N/A"}</span>
      </div>
      {subAqiLabel && (
        <span className="text-[10px] text-text-tertiary">{subAqiLabel}</span>
      )}
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

import { Chatbot } from "@/components/features/chatbot";

export default function PersonalizedDashboard() {
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();

  const [district, setDistrict] = useState<DistrictDetail | null>(null);
  const [safeTime, setSafeTime] = useState<SafeTimeResult | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (profileLoading) return;

    if (!profile || !profile.profile_completed) {
      router.push("/onboarding");
      return;
    }

    if (profile.home_district_id) {
      fetchDistrictData(profile.home_district_id);
    }
  }, [profile, profileLoading, router]);

  async function fetchDistrictData(districtId: string) {
    setDataLoading(true);
    try {
      const safeTimeUrl = `/api/v1/safe-time?district_id=${districtId}`;

      const [detailRes, safeRes] = await Promise.all([
        fetch(`/api/v1/districts/${districtId}`),
        fetch(safeTimeUrl),
      ]);

      const detailJson = await detailRes.json();
      const safeJson = await safeRes.json();

      if (detailJson.success) setDistrict(detailJson.data);
      if (safeJson.success) setSafeTime(safeJson.data);
    } catch (err) {
      console.error("Failed to fetch district data", err);
    } finally {
      setDataLoading(false);
    }
  }

  if (profileLoading || (dataLoading && !district)) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!profile || !profile.profile_completed) {
    return null; // Will redirect in useEffect
  }

  // Calculate pollutant values
  const effectivePm25 =
    district?.pm25 ??
    district?.pm25_value ??
    (district?.aqi != null ? pm25FromAQI(district.aqi) : null);

  const basePm25 = district?.pm25_value || 0;
  const displayPm10 = district?.pm10_value ?? Math.round(basePm25 * 1.5 * 10) / 10;
  const displayNo2 = district?.no2_value ?? Math.round(basePm25 * 0.4 * 10) / 10;
  const displaySo2 = district?.so2_value ?? Math.round(basePm25 * 0.1 * 10) / 10;
  const displayCo = district?.co_value ?? Math.round(basePm25 * 10);
  const displayO3 = district?.o3_value ?? 25.0;

  const pollutants = district
    ? [
        {
          name: "PM2.5",
          value: district.pm25_value ?? effectivePm25,
          unit: "µg/m³",
          subAqi:
            (district.pm25_value ?? effectivePm25) != null
              ? calculateEPA_AQI((district.pm25_value ?? effectivePm25)!)
              : null,
          icon: <Droplets className="h-4 w-4" />,
          accentColor: "#0369a1",
        },
        {
          name: "PM10",
          value: displayPm10,
          unit: "µg/m³",
          subAqi: calculatePM10_AQI(displayPm10),
          icon: <Wind className="h-4 w-4" />,
          accentColor: "#6d28d9",
        },
        {
          name: "CO",
          value: displayCo,
          unit: "ppm",
          subAqi: calculateCO_AQI(displayCo),
          icon: <Activity className="h-4 w-4" />,
          accentColor: "#b91c1c",
        },
        {
          name: "SO₂",
          value: displaySo2,
          unit: "ppb",
          subAqi: calculateSO2_AQI(displaySo2),
          icon: <CloudRain className="h-4 w-4" />,
          accentColor: "#ca8a04",
        },
        {
          name: "NO₂",
          value: displayNo2,
          unit: "ppb",
          subAqi: calculateNO2_AQI(displayNo2),
          icon: <AlertTriangle className="h-4 w-4" />,
          accentColor: "#ea580c",
        },
        {
          name: "O₃",
          value: displayO3,
          unit: "ppm",
          subAqi: calculateO3_AQI(displayO3),
          icon: <ShieldAlert className="h-4 w-4" />,
          accentColor: "#15803d",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">
              Welcome back, {profile.full_name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-text-secondary mt-1">
              Here is your personalized health overview for {district?.name || "your district"}.
            </p>
          </div>

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 flex gap-4 text-sm text-brand">
            <div>
              <span className="font-semibold block opacity-80 uppercase tracking-wider text-[10px]">Age Group</span>
              <span className="font-medium capitalize">{profile.age_group.replace("_", " ")}</span>
            </div>
            <div className="w-px bg-brand/20"></div>
            <div>
              <span className="font-semibold block opacity-80 uppercase tracking-wider text-[10px]">Conditions</span>
              <span className="font-medium capitalize">{profile.conditions.length > 0 ? profile.conditions.map(c => c.replace("_", " ")).join(", ") : "None"}</span>
            </div>
            <div className="w-px bg-brand/20"></div>
            <div>
              <span className="font-semibold block opacity-80 uppercase tracking-wider text-[10px]">Exposure</span>
              <span className="font-medium capitalize">{profile.exposure_level.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {district && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safe Exposure Time */}
            {safeTime && (
              <div className="bg-bg-secondary border border-border-default rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-brand" />
                  <h3 className="font-bold text-text-primary text-lg">Safe Outdoor Time</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black text-text-primary tracking-tight">
                    {safeTime.safe_minutes >= 999 ? "Unlimited" : `${safeTime.safe_minutes}`}
                  </span>
                  {safeTime.safe_minutes < 999 && (
                    <span className="text-xl font-medium text-text-secondary">minutes</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {safeTime.basis === "personal_health_profile"
                    ? "Based on your personal health profile and live AQI."
                    : "Baseline for general population."}{" "}
                  {safeTime.disclaimer}
                </p>
                <OutdoorTimer safeMinutes={safeTime.safe_minutes} />
              </div>
            )}

            {/* AI Advisor Chatbot */}
            <div className="bg-bg-secondary border border-border-default rounded-xl shadow-sm flex flex-col relative h-[500px] overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-border-default bg-bg-tertiary">
                <Activity className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-text-primary">AI Health Advisor</h3>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <Chatbot 
                  context={{
                    userName: profile.full_name || "User",
                    ageGroup: profile.age_group.replace("_", " "),
                    conditions: profile.conditions.length > 0 ? profile.conditions.map(c => c.replace("_", " ")).join(", ") : "None",
                    districtName: district.name,
                    aqi: district.aqi || 0,
                    pm25: district.pm25_value ?? effectivePm25
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pollutants Grid */}
        {district && (
          <section className="pt-4 pb-20">
            <h2 className="text-xl font-bold text-text-primary mb-4">Local Pollutants ({district.name})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pollutants.map((p) => (
                <PollutantCard key={p.name} {...p} />
              ))}
            </div>
          </section>
        )}

        {/* Floating Report Button (Bottom Center) */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="pointer-events-auto bg-community hover:bg-community-text text-white font-semibold py-3 px-6 rounded-full shadow-elevated flex items-center gap-2 transition-transform hover:scale-105"
          >
            <span className="relative flex h-3 w-3 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Report Symptoms
          </button>
        </div>

      </main>

      <SymptomReportModal
        districtId={district?.district_id || ""}
        districtName={district?.name || "your area"}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          if (profile?.home_district_id) {
            fetchDistrictData(profile.home_district_id);
          }
        }}
      />
    </div>
  );
}
