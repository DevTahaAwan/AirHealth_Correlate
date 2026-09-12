export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictDetail, SymptomType, SymptomReportSummary, RiskTier } from "@/lib/types";
import { pm25FromAQI } from "@/lib/utils/epa-aqi";

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

  // Fetch latest AQI reading for this district — including all pollutant fields
  const { data: station } = await supabase.from("stations").select("id").eq("district_id", id).single();
  let latestReading: {
    aqi_value: number;
    pm25_value: number | null;
    pm10_value: number | null;
    co: number | null;
    so2: number | null;
    no2: number | null;
    o3: number | null;
    recorded_at: string;
  } | null = null;

  if (station) {
    // Fetch the single most recent complete reading
    const { data: reading } = await supabase
      .from("aqi_readings")
      .select("aqi_value, pm25_value, pm10_value, co, so2, no2, o3, recorded_at")
      .eq("station_id", station.id)
      .not("aqi_value", "is", null)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (reading) {
      // Use raw data from database — no spatial multiplier applied
      latestReading = {
        aqi_value: reading.aqi_value,
        recorded_at: reading.recorded_at,
        pm25_value: reading.pm25_value || null,
        pm10_value: reading.pm10_value || null,
        co: reading.co || null,
        so2: reading.so2 || null,
        no2: reading.no2 || null,
        o3: reading.o3 || null,
      };
    }
  }

  // If PM2.5 is missing but AQI is present, derive it using strict EPA math
  let derivedPm25: number | null = null;
  if (latestReading && latestReading.pm25_value === null && latestReading.aqi_value != null) {
    derivedPm25 = pm25FromAQI(latestReading.aqi_value);
  }

  // Merge into a "district" object
  const district = {
    district_id: districtBase.id,
    name: districtBase.name,
    slug: districtBase.slug,
    centroid_lat: districtBase.centroid_lat,
    centroid_lng: districtBase.centroid_lng,
    current_aqi: latestReading?.aqi_value ?? null,
    current_pm25: latestReading?.pm25_value ?? derivedPm25,
    current_pm10: latestReading?.pm10_value ?? null,
    current_co: latestReading?.co ?? null,
    current_so2: latestReading?.so2 ?? null,
    current_no2: latestReading?.no2 ?? null,
    current_o3: latestReading?.o3 ?? null,
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
      eye_irritation: 0,
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
  
  let hourlyForecast: { time: string; temp: number }[] | undefined;
  
  try {
    const lat = district.centroid_lat || 31.5204;
    const lng = district.centroid_lng || 74.3587;
    // Fetch both daily precipitation (for rainExpected) and current weather
    const meteoRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability&daily=precipitation_sum&current=temperature_2m,wind_speed_10m,precipitation&past_days=0&forecast_days=2&timezone=auto`
    );
    
    if (meteoRes.ok) {
      const meteoJson = await meteoRes.json();
      
      if (meteoJson.daily && meteoJson.daily.precipitation_sum) {
        const sums = meteoJson.daily.precipitation_sum as number[];
        rainExpected = sums.some(sum => sum > 0);
      }

      if (meteoJson.current) {
        weatherContext = {
          temperature: meteoJson.current.temperature_2m || 0,
          windSpeed: meteoJson.current.wind_speed_10m || 0,
          precipitation: meteoJson.current.precipitation || 0,
        };
      }

      if (meteoJson.hourly && meteoJson.hourly.time && meteoJson.hourly.temperature_2m) {
        hourlyForecast = meteoJson.hourly.time.slice(0, 24).map((timeStr: string, idx: number) => {
          const date = new Date(timeStr);
          // Format as "2 PM" or "14:00" depending on locale. Let's do simple AM/PM
          const hours = date.getHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hr12 = hours % 12 || 12;
          return {
            time: `${hr12}:00 ${ampm}`,
            temp: meteoJson.hourly.temperature_2m[idx]
          };
        });
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
    aqi_value: district.current_aqi || null,
    pm25: district.current_pm25 || null,
    pm25_value: district.current_pm25 || null,
    pm10_value: district.current_pm10 || null,
    co: district.current_co || null,
    so2: district.current_so2 || null,
    no2: district.current_no2 || null,
    o3: district.current_o3 || null,
    co_value: district.current_co || null,
    so2_value: district.current_so2 || null,
    no2_value: district.current_no2 || null,
    o3_value: district.current_o3 || null,
    risk_tier: (district.current_risk_tier || "low") as RiskTier,
    symptom_reports_today: district.today_symptom_count || 0,
    has_aqi_data: district.current_aqi !== null,
    last_updated: district.last_updated || null,
    centroid_lat: district.centroid_lat || 31.5204,
    centroid_lng: district.centroid_lng || 74.3587,
    boundary_geojson: null,
    advisory_text:
      district.current_risk_tier === "very_high" || district.current_risk_tier === "high"
        ? "Avoid prolonged outdoor exertion. Sensitive groups should remain indoors."
        : "Air quality is acceptable. No major restrictions.",
    symptom_report_summary: symptomSummary,
    population: popData?.population || 500000,
    rain_expected: rainExpected,
    weather: weatherContext,
    hourly_forecast: hourlyForecast,
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
