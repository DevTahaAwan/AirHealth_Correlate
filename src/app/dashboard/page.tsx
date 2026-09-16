"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { DistrictDetail, SafeTimeResult } from "@/lib/types";
import { OutdoorTimer } from "@/components/features/outdoor-timer";
import {
  Activity,
  Clock,
  Wind,
  Droplets,
  ShieldAlert,
  CloudRain,
  AlertTriangle,
  Loader2,
  Stethoscope,
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

// ─── Daily Log Card Component ─────────────────────────────────────────────────

function DailyLogCard({ districtId, onSuccess }: { districtId: string, onSuccess: () => void }) {
  const [cough, setCough] = useState(0);
  const [breath, setBreath] = useState(0);
  const [sputum, setSputum] = useState("none");
  const [spo2, setSpo2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/symptom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_id: districtId,
          coughing_severity: cough,
          shortness_of_breath_severity: breath,
          sputum_color: sputum !== "none" ? sputum : undefined,
          spo2: spo2 ? parseInt(spo2, 10) : undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Log submitted successfully!");
        onSuccess();
      } else {
        alert(data.error?.message || "Failed to submit log");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting log");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col h-full text-white">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h3 className="font-bold text-lg">Daily Respiratory Check-in</h3>
      </div>
      
      <div className="space-y-6 flex-1">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-200">Coughing Severity ({cough}/10)</label>
          <input type="range" min="0" max="10" value={cough} onChange={e => setCough(Number(e.target.value))} className="w-full accent-cyan-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-200">Shortness of Breath ({breath}/10)</label>
          <input type="range" min="0" max="10" value={breath} onChange={e => setBreath(Number(e.target.value))} className="w-full accent-cyan-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-200">Sputum Color</label>
            <select value={sputum} onChange={e => setSputum(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none">
              <option value="none">None</option>
              <option value="clear">Clear</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-200">Today&apos;s SpO₂ %</label>
            <input type="number" min="0" max="100" placeholder="e.g. 98" value={spo2} onChange={e => setSpo2(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none" />
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={isSubmitting} className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50">
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Stethoscope className="h-5 w-5" />}
        Submit Log
      </button>
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

  let precaution = "Standard WHO outdoor exercise guidelines. Stay hydrated and monitor for any discomfort.";
  let precautionStyle = "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
  let PrecautionIcon = Activity;

  if (district) {
    const hasAsthma = profile.conditions.includes("asthma");
    const hasCopd = profile.conditions.includes("copd");
    const aqi = district.aqi || 0;

    if (hasAsthma && aqi > 150) {
      precaution = "Hazardous AQI: Keep rescue inhaler accessible. Limit aerobic exertion.";
      precautionStyle = "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400";
      PrecautionIcon = ShieldAlert;
    } else if (hasAsthma && aqi > 100) {
      precaution = "Keep rescue inhaler accessible. Monitor for symptoms.";
      precautionStyle = "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
      PrecautionIcon = ShieldAlert;
    } else if (hasCopd && aqi > 100) {
      precaution = "High particulate concentration will cause airway constriction. Use HEPA filtration indoors.";
      precautionStyle = "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400";
      PrecautionIcon = ShieldAlert;
    }
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

          <div className="flex gap-4">
            {/* Live AQI Card */}
            {district && (
              <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex flex-col items-center justify-center shadow-sm min-w-[120px]">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Live AQI</span>
                <span className="text-4xl font-black tracking-tight" style={{ color: getAQICategory(district.aqi || 0).color }}>
                  {district.aqi || "—"}
                </span>
                <span className="text-[10px] text-text-tertiary mt-1 font-semibold">{getAQICategory(district.aqi || 0).label}</span>
              </div>
            )}

            <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 flex flex-col justify-center gap-2 text-sm text-brand min-w-[150px]">
              <div>
                <span className="font-semibold block opacity-80 uppercase tracking-wider text-[10px]">Age Group</span>
                <span className="font-medium capitalize">{profile.age_group.replace("_", " ")}</span>
              </div>
              <div className="w-full h-px bg-brand/20"></div>
              <div>
                <span className="font-semibold block opacity-80 uppercase tracking-wider text-[10px]">Conditions</span>
                <span className="font-medium capitalize">{profile.conditions.length > 0 ? profile.conditions.map(c => c.replace("_", " ")).join(", ") : "None"}</span>
              </div>
            </div>
          </div>
        </div>

        {district && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safe Exposure Time & Precautions */}
            <div className="flex flex-col gap-6">
              {safeTime && (
                <div className="bg-bg-secondary border border-border-default rounded-xl p-6 shadow-sm flex-1">
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
            
            <div className={cn("border rounded-xl p-4 flex gap-3 items-start", precautionStyle)}>
              <PrecautionIcon className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Precautionary Measures</h4>
                <p className="font-medium text-sm leading-relaxed">{precaution}</p>
              </div>
            </div>
            </div>

            {/* Community Signal Card -> Replaced by 3-Second Daily Log */}
            <DailyLogCard 
              districtId={district.district_id} 
              onSuccess={() => {
                if (profile?.home_district_id) {
                  fetchDistrictData(profile.home_district_id);
                }
              }} 
            />
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

      </main>

      {/* Floating Chatbot */}
      {district && (
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
      )}

    </div>
  );
}
