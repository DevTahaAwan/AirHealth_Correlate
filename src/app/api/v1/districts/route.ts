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
        const { data: latestReading } = await supabase
          .from("aqi_readings")
          .select("aqi_value, pm25_value, recorded_at")
          .eq("station_id", station.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        if (latestReading) {
          statusMap.set(station.district_id, {
            current_aqi: latestReading.aqi_value,
            current_pm25: latestReading.pm25_value,
            last_updated: latestReading.recorded_at,
            current_risk_tier: getRiskTier(latestReading.aqi_value),
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

  // The view columns match DistrictListItem closely, but we map explicitly just in case
  const districts: DistrictListItem[] = allDistricts.map(d => {
    const status = statusMap.get(d.id) || {};
    
    return {
      district_id: d.id,
      name: d.name,
      slug: d.slug,
      aqi: status.current_aqi || null,
      pm25: status.current_pm25 || null,
      risk_tier: (status.current_risk_tier || "low") as RiskTier,
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
