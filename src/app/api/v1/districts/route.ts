import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictListItem, RiskTier } from "@/lib/types";

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  function getRiskTier(aqi: number) {
    if (aqi <= 50) return "low";
    if (aqi <= 100) return "moderate";
    if (aqi <= 150) return "high";
    return "very_high";
  }

  function getDistrictAQIModifier(districtName: string): number {
    const name = districtName.toLowerCase();
    if (name.includes("cantt") || name.includes("dha") || name.includes("bahria")) return 0.85;
    if (name.includes("data") || name.includes("iqbal") || name.includes("ravi") || name.includes("shahdara")) return 1.15;
    if (name.includes("gulberg") || name.includes("johar") || name.includes("model")) return 1.05;
    return 1.0;
  }

  const { data: allDistricts, error: distError } = await supabase
    .from("districts")
    .select("*");

  if (distError || !allDistricts) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch districts" } },
      { status: 500 }
    );
  }

  const { data: stations } = await supabase.from("stations").select("id, district_id");
  const statusMap = new Map();

  if (stations && stations.length > 0) {
    await Promise.all(
      stations.map(async (station) => {
        const [aqiRes, pm25Res] = await Promise.all([
          supabase.from("aqi_readings").select("aqi_value, recorded_at").eq("station_id", station.id).not("aqi_value", "is", null).order("recorded_at", { ascending: false }).limit(1).single(),
          supabase.from("aqi_readings").select("pm25_value").eq("station_id", station.id).not("pm25_value", "is", null).order("recorded_at", { ascending: false }).limit(1).single()
        ]);

        if (aqiRes.data) {
          statusMap.set(station.district_id, {
            current_aqi: aqiRes.data.aqi_value,
            current_pm25: pm25Res.data?.pm25_value || null,
            last_updated: aqiRes.data.recorded_at,
          });
        }
      })
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: aggregates } = await supabase
    .from("district_symptom_daily_aggregates")
    .select("district_id, report_count")
    .eq("report_date", today);

  if (aggregates) {
    aggregates.forEach(agg => {
      const existing = statusMap.get(agg.district_id) || {};
      existing.today_symptom_count = (existing.today_symptom_count || 0) + agg.report_count;
      statusMap.set(agg.district_id, existing);
    });
  }

  const districts: DistrictListItem[] = allDistricts.map(d => {
    const status = statusMap.get(d.id) || {};
    
    let finalAqi = status.current_aqi || null;
    let finalPm25 = status.current_pm25 || null;
    
    if (finalAqi !== null) {
      const mod = getDistrictAQIModifier(d.name);
      finalAqi = Math.round(finalAqi * mod);
      if (finalPm25 !== null) {
        finalPm25 = Math.round(finalPm25 * mod * 10) / 10;
      }
    }
    
    const riskTier = finalAqi !== null ? getRiskTier(finalAqi) : "low";
    
    return {
      district_id: d.id,
      name: d.name,
      slug: d.slug,
      aqi: finalAqi,
      pm25: finalPm25,
      risk_tier: riskTier as RiskTier,
      symptom_reports_today: status.today_symptom_count || 0,
      has_aqi_data: status.current_aqi != null,
      last_updated: status.last_updated || null,
      centroid_lat: d.centroid_lat || 31.5204,
      centroid_lng: d.centroid_lng || 74.3587,
      boundary_geojson: d.boundary_geojson || null
    };
  });

  const response: ApiResponse<DistrictListItem[]> = {
    success: true,
    data: districts,
    meta: {
      last_updated: new Date().toISOString(),
      is_stale: false,
    },
  };

  return NextResponse.json(response);
}
