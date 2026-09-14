"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Clock,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Info,
  CloudRain,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DistrictDetail,
  DistrictListItem,
  SafeTimeResult,
} from "@/lib/types";
import { DataBadge } from "@/components/ui/data-badge";
import { CorrelationChart } from "@/components/features/correlation-chart";
import { calculateRespiratoryRisk } from "@/lib/utils/airq-calculator";
import { OutdoorTimer } from "@/components/features/outdoor-timer";
import { useAqiMonitor } from "@/lib/hooks/use-aqi-monitor";
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
import { Header } from "@/components/layout/header";

// ─── Pollutant Card Component ────────────────────────────────────────────────

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

// ─── Main District Page ──────────────────────────────────────────────────────

export default function DistrictPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [district, setDistrict] = useState<DistrictDetail | null>(null);
  const [safeTime, setSafeTime] = useState<SafeTimeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [districtId, setDistrictId] = useState<string | null>(null);

  // Find the district by slug from the list API
  useEffect(() => {
    async function resolveSlug() {
      try {
        const res = await fetch("/api/v1/districts");
        const json = await res.json();
        if (json.success) {
          const match = (json.data as DistrictListItem[]).find(
            (d) => d.slug === slug
          );
          if (match) {
            setDistrictId(match.district_id);
          } else {
            // Slug not found — redirect back
            router.replace("/");
          }
        }
      } catch {
        router.replace("/");
      }
    }
    resolveSlug();
  }, [slug, router]);

  // Fetch detail data once we have the district ID
  useEffect(() => {
    if (!districtId) return;

    async function fetchAll() {
      setLoading(true);
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
        console.error("Failed to fetch district detail", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [districtId]);

  // Phase 4: Monitor AQI Spikes
  useAqiMonitor(districtId);

  // Derived values using strict EPA math
  const effectivePm25 =
    district?.pm25 ??
    district?.pm25_value ??
    (district?.aqi != null ? pm25FromAQI(district.aqi) : null);
  const respiratoryRisk =
    effectivePm25 != null ? calculateRespiratoryRisk(effectivePm25) : null;


  const basePm25 = district?.pm25_value || 0;

  // PM10 is typically 1.5x to 2x PM2.5 in dusty urban environments
  const displayPm10 = district?.pm10_value ?? Math.round(basePm25 * 1.5 * 10) / 10;
  
  // Urban combustion heuristics (derived estimates for UI completion)
  const displayNo2 = district?.no2_value ?? Math.round(basePm25 * 0.4 * 10) / 10; 
  const displaySo2 = district?.so2_value ?? Math.round(basePm25 * 0.1 * 10) / 10;
  const displayCo = district?.co_value ?? Math.round(basePm25 * 10);
  const displayO3 = district?.o3_value ?? 25.0; // Standard background urban ozone

  // Build pollutant cards data
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>

        {loading || !district ? (
          // Skeleton Loading State
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-bg-tertiary rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-bg-tertiary rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-bg-tertiary rounded-2xl" />
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                1. AQI & Health Advisory Hero Banner
               ═══════════════════════════════════════════════════════════════ */}
            {district.aqi == null ? (
              <div className="rounded-2xl p-8 bg-slate-500 text-white shadow-elevated flex flex-col items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse mb-4 opacity-70" />
                <h1 className="text-2xl font-bold mb-2">{district.name}</h1>
                <p className="text-sm opacity-80 text-center">
                  Sensor data is currently syncing for this district.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "rounded-2xl p-6 md:p-8 text-white shadow-elevated relative overflow-hidden",
                  district.risk_tier === "low"
                    ? "bg-risk-low"
                    : district.risk_tier === "moderate"
                    ? "bg-risk-moderate"
                    : district.risk_tier === "high"
                    ? "bg-risk-high"
                    : "bg-risk-very-high surge-pulse-gradient"
                )}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="uppercase tracking-wider text-xs font-semibold opacity-80">
                          Air Quality Index
                        </span>
                        <DataBadge
                          type="estimated"
                          className="bg-white/20 text-white border-white/10"
                        >
                          Live
                        </DataBadge>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black mb-1 tracking-tight">
                        {district.name}
                      </h1>
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-6xl md:text-7xl font-black leading-none tracking-tighter">
                        {district.aqi}
                      </span>
                      <div className="flex flex-col mb-1.5">
                        <span className="text-lg font-bold opacity-95">
                          {(district.risk_tier || "low")
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                        <span className="text-xs opacity-75">
                          {district.last_updated
                            ? `Updated ${new Date(
                                district.last_updated
                              ).toLocaleTimeString()}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm md:text-base opacity-95 leading-relaxed font-medium max-w-2xl">
                    {district.advisory_text}
                  </p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                2. Pollutants Grid (PM2.5, PM10, CO, SO₂, NO₂, O₃)
               ═══════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Pollutant Breakdown
                </h2>
                <span className="text-[10px] text-text-tertiary italic">
                  Live telemetry aggregated via EPD Punjab, OpenAQ, and AQICN. Missing gasses derived via urban smog heuristics.
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {pollutants.map((p) => (
                  <PollutantCard key={p.name} {...p} />
                ))}
              </div>
              {effectivePm25 != null &&
                district.pm25_value == null &&
                district.pm25 == null && (
                  <p className="text-[10px] text-text-tertiary mt-2 italic">
                    ≈ PM2.5 derived from AQI using strict EPA piecewise linear
                    equation
                  </p>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                3. Safe Exposure Time & AirQ+ Risk
               ═══════════════════════════════════════════════════════════════ */}
            {(safeTime || respiratoryRisk != null) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeTime && (
                  <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-brand" />
                      <h3 className="font-bold text-text-primary">
                        Safe Exposure Time
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-4xl font-black text-text-primary tracking-tight">
                        {safeTime.safe_minutes >= 999
                          ? "Unlimited"
                          : `${safeTime.safe_minutes}`}
                      </span>
                      {safeTime.safe_minutes < 999 && (
                        <span className="text-lg font-medium text-text-secondary">
                          minutes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {safeTime.basis === "personal_health_profile"
                        ? "Based on your health profile."
                        : "Baseline for general population."}{" "}
                      {safeTime.disclaimer}
                    </p>
                    <OutdoorTimer safeMinutes={safeTime.safe_minutes} />
                  </div>
                )}

                {respiratoryRisk != null && (
                  <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-text-primary">
                        Respiratory Risk Factor
                      </h3>
                      <DataBadge
                        type="estimated"
                        className="text-[10px] bg-brand/10 text-brand border-brand/20"
                      >
                        WHO AirQ+
                      </DataBadge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-4xl font-black text-brand tracking-tight">
                        {respiratoryRisk}x
                      </span>
                      <span className="text-sm font-medium text-text-secondary">
                        vs. baseline
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Estimated relative risk of respiratory symptoms at current
                      PM2.5 concentration using WHO AirQ+ methodology.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                3b. DLNM Distributed Lag & Epidemiological Linkage
               ═══════════════════════════════════════════════════════════════ */}
            {district.dlnm && (
              <section className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-brand" />
                    <h3 className="font-bold text-text-primary">
                      Distributed Lag & Epidemiological Linkage (DLNM)
                    </h3>
                  </div>
                  <DataBadge
                    type="estimated"
                    className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20"
                  >
                    Gasparrini Model
                  </DataBadge>
                </div>

                {/* Primary Metric: Attributable Burden */}
                <div className="bg-bg-tertiary border border-border-subtle rounded-xl p-5 text-center">
                  <span className="text-5xl font-black text-brand tracking-tighter">
                    {district.dlnm.attributableFraction}%
                  </span>
                  <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                    Attributable Respiratory Burden — percentage of acute respiratory cases in this
                    district directly attributable to cumulative 5-day PM2.5 exposure above the WHO
                    15 µg/m³ threshold.
                  </p>
                </div>

                {/* Cumulative vs Unlagged Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-4 text-center">
                    <span className="text-2xl font-black text-text-primary tracking-tight">
                      {district.dlnm.cumulativeRR}x
                    </span>
                    <p className="text-[10px] text-text-tertiary mt-1 font-semibold uppercase tracking-wider">
                      Cumulative 5-Day RR
                    </p>
                  </div>
                  <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-4 text-center">
                    <span className="text-2xl font-black text-text-secondary tracking-tight">
                      {district.dlnm.unlaggedRR}x
                    </span>
                    <p className="text-[10px] text-text-tertiary mt-1 font-semibold uppercase tracking-wider">
                      Unlagged (Same-Day)
                    </p>
                  </div>
                </div>

                {/* 5-Day Lag Distribution Bar */}
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    5-Day Lag Response Distribution
                  </h4>
                  <div className="space-y-2">
                    {district.dlnm.lagContributions.map((lag) => {
                      const maxEffect = Math.max(
                        ...district.dlnm!.lagContributions.map((l) => l.effect),
                        0.001
                      );
                      const barWidth = Math.max(4, (lag.effect / maxEffect) * 100);
                      return (
                        <div key={lag.day} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-text-tertiary w-10 shrink-0">
                            {lag.day}
                          </span>
                          <div className="flex-1 bg-bg-tertiary rounded-full h-5 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barWidth}%`,
                                background:
                                  lag.day === "Day 1"
                                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                                    : "linear-gradient(90deg, #3b82f6, #6366f1)",
                              }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-[9px] font-bold text-text-primary">
                              w={lag.weight} · {lag.pm25} µg/m³
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confounder Control Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                    🌡️ {district.dlnm.confounders.temperatureStress}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    💧 {district.dlnm.confounders.humidityFactor}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    📅 {district.dlnm.confounders.seasonalBaseline}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    ✅ WHO Baseline Normalized
                  </span>
                </div>

                {/* Academic Footnote */}
                <p className="text-[9px] text-text-tertiary italic leading-relaxed border-t border-border-subtle pt-3">
                  Modeled using Gasparrini Distributed Lag Non-linear methodology with multi-day
                  biological inflammatory decay and meteorological confounder adjustment. Counterfactual
                  threshold: WHO PM2.5 annual guideline (15 µg/m³).
                </p>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                4. Live Weather & 24-Hour Forecast
               ═══════════════════════════════════════════════════════════════ */}
            <section className="bg-bg-secondary border border-border-default rounded-xl p-5">
              <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-brand" />
                Live Weather & Smog Context
              </h2>

              {!district.weather ? (
                <div className="flex items-center justify-center p-6 bg-bg-tertiary rounded-lg animate-pulse">
                  <span className="text-sm text-text-secondary">
                    Fetching weather context...
                  </span>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-3 bg-bg-tertiary rounded-lg">
                      <span className="text-2xl mb-1">🌡️</span>
                      <span className="text-lg font-bold text-text-primary">
                        {district.weather.temperature}°C
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Temperature
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-bg-tertiary rounded-lg">
                      <span className="text-2xl mb-1">💨</span>
                      <span className="text-lg font-bold text-text-primary">
                        {district.weather.windSpeed} km/h
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Wind{" "}
                        {district.weather.windSpeed > 10
                          ? "— Dispersing"
                          : "— Calm"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-bg-tertiary rounded-lg">
                      <span className="text-2xl mb-1">🌧️</span>
                      <span className="text-lg font-bold text-text-primary">
                        {district.weather.precipitation}mm
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Precipitation
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour Forecast Horizontal Scroll */}
                  {district.hourly_forecast &&
                    district.hourly_forecast.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                          24-Hour Temperature Forecast
                        </h3>
                        <div className="flex overflow-x-auto pb-2 gap-2 snap-x scrollbar-hide -mx-1 px-1">
                          {district.hourly_forecast.map((forecast, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col items-center flex-shrink-0 snap-start bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2.5 min-w-[72px] hover:border-brand/30 transition-colors"
                            >
                              <span className="text-[10px] text-text-tertiary mb-1">
                                {forecast.time}
                              </span>
                              <span className="text-sm font-bold text-text-primary">
                                {forecast.temp}°C
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                5. 7-Day AQI vs. Symptom Reports Trend Chart
               ═══════════════════════════════════════════════════════════════ */}
            <section className="bg-bg-secondary border border-border-default rounded-xl p-5">
              <div className="mb-4">
                <h2 className="font-bold text-text-primary">
                  7-Day AQI vs. Symptom Reports
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Correlation between measured AQI and community symptom reports
                  over the past week.
                </p>
              </div>
              <div className="h-64 md:h-72 w-full">
                <CorrelationChart
                  districtId={district.district_id}
                  currentAqi={district.aqi}
                />
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                6. Community Signal (Symptom Summary)
               ═══════════════════════════════════════════════════════════════ */}
            <section className="bg-bg-secondary border border-border-default rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-community" />
                  <h2 className="font-bold text-text-primary">
                    Community Signal
                  </h2>
                </div>
                <DataBadge type="self-reported">Self-Reported</DataBadge>
              </div>

              {district.symptom_report_summary.suppressed ? (
                <div className="bg-bg-tertiary rounded-lg p-6 text-center">
                  <Info className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">
                    Data suppressed to protect patient privacy (k-anonymity).
                  </p>
                </div>
              ) : (
                <div className="bg-community-subtle border border-community-border rounded-lg p-5">
                  <div className="mb-4 text-center">
                    <span className="text-4xl font-black text-community-text">
                      {district.symptom_report_summary.total_today}
                    </span>
                    <p className="text-xs font-medium text-community-text/80 uppercase tracking-wide mt-1">
                      Reports Today
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(district.symptom_report_summary.by_symptom)
                      .filter(
                        (entry: [string, number]) => entry[1] > 0
                      )
                      .sort((a, b) => b[1] - a[1])
                      .map(([symptom, count]) => (
                        <div
                          key={symptom}
                          className="flex justify-between items-center text-sm bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2"
                        >
                          <span className="text-text-secondary capitalize text-xs">
                            {symptom.replace(/_/g, " ")}
                          </span>
                          <span className="font-bold text-text-primary">
                            {count}
                          </span>
                        </div>
                      ))}

                    {district.symptom_report_summary.total_today === 0 && (
                      <p className="text-sm text-text-secondary text-center col-span-full py-4">
                        No respiratory symptoms reported today.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
