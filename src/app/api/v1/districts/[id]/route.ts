export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictDetail, SymptomType, SymptomReportSummary, RiskTier } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = getSupabaseAdmin();

  function getRiskTier(aqi: number) {
    if (aqi <= 50) return "low";
    if (aqi <= 100) return "moderate";
    if (aqi <= 150) return "high";
    return "very_high";
  }

  // 1. Fetch district base data directly
  const { data: districtBase, error: districtError } = await supabase
    .from("districts")
    .select("*")
    .eq("id", id)
    .single();

  if (districtError || !districtBase) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "District not found" } },
      { status: 404 }
    );
  }

  // Fetch latest AQI reading for this district
  const { data: station } = await supabase.from("stations").select("id").eq("district_id", id).single();
  let latestReading = null;
  if (station) {
    const { data } = await supabase
      .from("aqi_readings")
      .select("aqi_value, pm25_value, recorded_at")
      .eq("station_id", station.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();
    latestReading = data;
  }

  // Merge into a "district" object to match the rest of the code
  const district = {
    district_id: districtBase.id,
    name: districtBase.name,
    slug: districtBase.slug,
    centroid_lat: districtBase.centroid_lat,
    centroid_lng: districtBase.centroid_lng,
    current_aqi: latestReading?.aqi_value ?? null,
    current_pm25: latestReading?.pm25_value ?? null,
    last_updated: latestReading?.recorded_at ?? null,
    current_risk_tier: latestReading ? getRiskTier(latestReading.aqi_value) : "low",
    today_symptom_count: 0
  };

  // 2. Fetch today's symptom aggregates
  const today = new Date().toISOString().split('T')[0];
  const { data: symptomsData } = await supabase
    .from("district_symptom_daily_aggregates")
    .select("symptom, report_count, suppressed")
    .eq("district_id", id)
    .eq("report_date", today);

  const symptomSummary: SymptomReportSummary = {
    total_today: 0,
    by_symptom: {
      wheezing: 0,
      coughing: 0,
      shortness_of_breath: 0,
      chest_tightness: 0,
      inhaler_used: 0,
    },
    suppressed: false,
  };

  if (symptomsData) {
    let anySuppressed = false;
    for (const row of symptomsData) {
      if (row.suppressed) {
        anySuppressed = true;
      }
      if (!row.suppressed && row.symptom in symptomSummary.by_symptom) {
        symptomSummary.by_symptom[row.symptom as SymptomType] = row.report_count;
        symptomSummary.total_today += row.report_count;
      }
    }
    symptomSummary.suppressed = anySuppressed;
  }

  // 3. Fetch population
  const { data: popData } = await supabase
    .from("population_figures")
    .select("population")
    .eq("district_id", id)
    .eq("is_current", true)
    .single();

  // 4. Fetch Weather Data (Rain Expected & Current Context)
  let rainExpected = false;
  let weatherContext: DistrictDetail["weather"] = undefined;
  
  try {
    const lat = district.centroid_lat || 31.5204;
    const lng = district.centroid_lng || 74.3587;
    // Fetch both daily precipitation (for rainExpected) and current weather
    const meteoRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&current=temperature_2m,wind_speed_10m,precipitation&past_days=0&forecast_days=2&timezone=auto`
    );
    
    if (meteoRes.ok) {
      const meteoJson = await meteoRes.json();
      
      if (meteoJson.daily && meteoJson.daily.precipitation_sum) {
        const sums = meteoJson.daily.precipitation_sum as number[];
        // If today or tomorrow has > 0mm rain
        rainExpected = sums.some(sum => sum > 0);
      }

      if (meteoJson.current) {
        weatherContext = {
          temperature: meteoJson.current.temperature_2m || 0,
          windSpeed: meteoJson.current.wind_speed_10m || 0,
          precipitation: meteoJson.current.precipitation || 0,
        };
      }
    }
  } catch (err) {
    console.error("Failed to fetch Open-Meteo data", err);
  }

  const detail: DistrictDetail = {
    district_id: district.district_id,
    name: district.name,
    slug: district.slug,
    aqi: district.current_aqi || null,
    pm25: district.current_pm25 || null,
    risk_tier: (district.current_risk_tier || "low") as RiskTier,
    symptom_reports_today: district.today_symptom_count || 0,
    has_aqi_data: district.current_aqi !== null,
    last_updated: district.last_updated || null,
    centroid_lat: 31.5204, // Default or fetch from district base table if needed
    centroid_lng: 74.3587,
    boundary_geojson: null,
    advisory_text:
      district.current_risk_tier === "very_high" || district.current_risk_tier === "high"
        ? "Avoid prolonged outdoor exertion. Sensitive groups should remain indoors."
        : "Air quality is acceptable. No major restrictions.",
    symptom_report_summary: symptomSummary,
    population: popData?.population || 500000,
    rain_expected: rainExpected,
    weather: weatherContext,
  };

  const response: ApiResponse<DistrictDetail> = {
    success: true,
    data: detail,
    meta: {
      last_updated: new Date().toISOString(),
      is_stale: false,
    },
  };

  return NextResponse.json(response);
}
