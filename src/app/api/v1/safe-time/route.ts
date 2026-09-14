export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { MockDataStore } from "@/lib/store";
import { calculateSafeExposure } from "@/lib/services";
import { RespiratoryCondition } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("district_id");
  const conditionsParam = searchParams.get("conditions");
  let ageGroup = searchParams.get("ageGroup") || "adult";
  let exposure = searchParams.get("exposure") || "mostly_indoors";
  let conditions: RespiratoryCondition[] = [];

  if (!districtId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "district_id is required" } },
      { status: 400 }
    );
  }

  const districts = await MockDataStore.getDistrictList();
  const district = districts.find((d) => d.district_id === districtId);

  if (!district) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "District not found" } },
      { status: 404 }
    );
  }

  const aqi = district.aqi || 50;

  // Try to load user profile from Supabase if authenticated
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", user.id)
        .single();
      
      if (profile) {
        ageGroup = profile.age_group || ageGroup;
        exposure = profile.exposure_level || exposure;
        if (profile.conditions && Array.isArray(profile.conditions)) {
          conditions = profile.conditions as RespiratoryCondition[];
        }
      }
    } else if (conditionsParam) {
      // Fallback to query params if not authenticated
      conditions = conditionsParam.split(",") as RespiratoryCondition[];
    }
  } catch {
    // Graceful fallback to query params
    if (conditionsParam) {
      conditions = conditionsParam.split(",") as RespiratoryCondition[];
    }
  }

  const result = calculateSafeExposure(aqi, conditions, ageGroup, exposure);
  result.district_id = districtId;

  return NextResponse.json({
    success: true,
    data: result,
  });
}
