export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
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

  const supabase = getSupabaseAdmin();

  const { data: districtBase, error: districtError } = await supabase
    .from("districts")
    .select("id, name")
    .eq("id", districtId)
    .single();

  if (districtError || !districtBase) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "District not found" } },
      { status: 404 }
    );
  }

  const { data: station } = await supabase
    .from("stations")
    .select("id")
    .eq("district_id", districtId)
    .single();

  let aqi = 50;
  if (station) {
    const { data: reading } = await supabase
      .from("aqi_readings")
      .select("aqi_value")
      .eq("station_id", station.id)
      .not("aqi_value", "is", null)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();
    if (reading?.aqi_value != null) {
      aqi = reading.aqi_value;
    }
  }

  try {
    const supabaseAuth = createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

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
      conditions = conditionsParam.split(",") as RespiratoryCondition[];
    }
  } catch {
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
