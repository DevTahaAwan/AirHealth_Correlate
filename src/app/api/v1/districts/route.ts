import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictListItem } from "@/lib/types";

export async function GET() {
  const supabase = getSupabaseAdmin();
  
  // Fetch all districts to ensure we don't miss any due to inner joins in the view
  const { data: allDistricts, error: distError } = await supabase
    .from("districts")
    .select("*");

  const { data: statusData, error: statError } = await supabase
    .from("v_district_current_status")
    .select("*");

  console.log("Supabase districts fetch result:", { allDistricts: allDistricts?.length, statusData: statusData?.length });

  if (distError || statError || !allDistricts) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch districts" } },
      { status: 500 }
    );
  }

  // Create a map for quick lookup
  const statusMap = new Map();
  if (statusData) {
    statusData.forEach(d => {
      statusMap.set(d.district_id, d);
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
      risk_tier: status.current_risk_tier || "low",
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
