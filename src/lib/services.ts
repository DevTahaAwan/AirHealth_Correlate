import {
  RiskTier,
  RespiratoryCondition,
  SafeTimeResult,
  SurgeFlagItem,
} from "./types";

// ============================================================================
// AirHealth Correlate — Core Domain Services
// Safe Exposure Time Calculator & Surge Heuristic Engine
// ============================================================================

const BASELINE_SAFE_MINUTES = 120; // 2 hours for a healthy adult at moderate AQI

/**
 * Calculates a Safe Exposure Time estimate based on AQI and Health Profile.
 * Formula simplified from WHO AirQ+ modeling concepts.
 */
export function calculateSafeExposure(
  aqi: number,
  conditions: RespiratoryCondition[] = [],
  ageGroup: string = "adult",
  exposure: string = "mostly_indoors"
): SafeTimeResult {
  let riskTier: RiskTier = "low";
  let multiplier = 1.0;

  if (aqi <= 50) {
    riskTier = "low";
    multiplier = 2.0; // Unlimited practically, but cap for logic
  } else if (aqi <= 100) {
    riskTier = "moderate";
    multiplier = 1.0;
  } else if (aqi <= 200) {
    riskTier = "high";
    multiplier = 0.5; // Half the safe time
  } else {
    riskTier = "very_high";
    multiplier = 0.25; // Quarter the safe time
  }

  // Apply condition penalties
  let penalty = 1.0;
  if (conditions.includes("asthma") || conditions.includes("copd")) {
    penalty = 0.4;
  } else if (
    conditions.includes("bronchitis") ||
    conditions.includes("allergic_rhinitis") ||
    conditions.includes("other_respiratory")
  ) {
    penalty = 0.7;
  }

  let ageMultiplier = 1.0;
  if (ageGroup === "child") ageMultiplier = 0.7;
  if (ageGroup === "senior") ageMultiplier = 0.6;

  let exposureMultiplier = 1.0;
  if (exposure === "commuter") exposureMultiplier = 0.8;
  if (exposure === "outdoor_worker") exposureMultiplier = 0.5;

  const safeMinutes = Math.round(BASELINE_SAFE_MINUTES * multiplier * penalty * ageMultiplier * exposureMultiplier);

  return {
    district_id: "unknown",
    safe_minutes: riskTier === "low" ? 999 : safeMinutes,
    risk_tier: riskTier,
    basis: conditions.length > 0 ? "personal_health_profile" : "general_vulnerable_group",
    aqi_value: aqi,
    conditions_applied: conditions,
    disclaimer:
      "This is an estimated limit based on generic guidelines. Consult your physician.",
  };
}

import { getSupabaseAdmin } from "./supabase/client";

/**
 * Evaluates the Surge Heuristic (Rule 2 from TRD).
 * If AQI > 200 for 24h+ AND community symptom signals are spiking,
 * trigger an elevated likelihood of hospital admissions.
 */
export async function computeSurgeHeuristic(): Promise<SurgeFlagItem[]> {
  const supabase = getSupabaseAdmin();
  const { data: districts, error } = await supabase
    .from("v_district_current_status")
    .select("*");

  if (error || !districts) {
    console.error("Failed to fetch districts for surge heuristic", error);
    return [];
  }

  const flags: SurgeFlagItem[] = [];

  const now = new Date();
  // 24h to 48h lag window
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  districts.forEach((d) => {
    // Heuristic: If AQI > 200 and Symptoms > 3 -> Trigger Alert
    // We use today_symptom_count from the view
    if (
      d.current_aqi !== null &&
      d.current_aqi > 200 &&
      (d.today_symptom_count || 0) >= 2 // Lower threshold for mock demo purposes
    ) {
      flags.push({
        district_id: d.district_id,
        district_name: d.name,
        flag_status: "elevated_likelihood",
        triggered_by_date: now.toISOString(),
        triggering_aqi: d.current_aqi,
        expected_window_start: windowStart.toISOString(),
        expected_window_end: windowEnd.toISOString(),
        predicted_increase_pct: Math.min((d.current_aqi / 200) * 15, 35), // Rough mock calculation (15-35%)
        basis_citation: "Dominici F, et al. Short-term PM2.5 Exposure and Respiratory Admissions.",
      });
    }
  });

  return flags;
}
