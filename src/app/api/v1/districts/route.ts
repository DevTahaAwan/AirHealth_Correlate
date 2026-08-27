import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictListItem } from "@/lib/types";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("v_district_current_status")
    .select("*");

  console.log("Supabase districts fetch result:", { data, error });

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch districts" } },
      { status: 500 }
    );
  }

  // The view columns match DistrictListItem closely, but we map explicitly just in case
  const districts: DistrictListItem[] = data.map(d => ({
    district_id: d.district_id,
    name: d.name,
    slug: d.slug,
    aqi: d.current_aqi || null,
    pm25: d.current_pm25 || null,
    risk_tier: d.current_risk_tier || "low",
    symptom_reports_today: d.today_symptom_count || 0,
    has_aqi_data: d.current_aqi !== null,
    last_updated: d.last_updated || null,
    centroid_lat: 31.5204, // Default or fetch from district base table if needed
    centroid_lng: 74.3587,
    boundary_geojson: null
  }));

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
