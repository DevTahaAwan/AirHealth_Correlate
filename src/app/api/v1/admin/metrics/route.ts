import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/utils/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseClient = createSupabaseServerClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // 1. Total reports today
    const { data: todayReports } = await supabase
      .from("symptom_reports")
      .select("device_id, district_id")
      .eq("reported_at", today);

    let totalReportsToday = 0;
    const districtCounts: Record<string, number> = {};
    if (todayReports) {
      const uniqueReports = new Set<string>();
      todayReports.forEach(r => {
        const key = `${r.device_id}-${r.district_id}`;
        if (!uniqueReports.has(key)) {
          uniqueReports.add(key);
          districtCounts[r.district_id] = (districtCounts[r.district_id] || 0) + 1;
        }
      });
      totalReportsToday = uniqueReports.size;
    }

    // 2. Most affected district
    let maxCount = 0;
    let mostAffectedDistrictId = "";
    Object.entries(districtCounts).forEach(([dId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostAffectedDistrictId = dId;
      }
    });

    let mostAffectedDistrict = "None";
    if (mostAffectedDistrictId) {
      const { data: districtRow } = await supabase
        .from("districts")
        .select("name")
        .eq("id", mostAffectedDistrictId)
        .single();
      if (districtRow) {
        mostAffectedDistrict = districtRow.name;
      }
    }

    // 3. City-wide AQI Average
    const { data: stations } = await supabase.from("stations").select("id");
    
    let cityAqiAverage = 0;
    if (stations && stations.length > 0) {
      const aqiValues: number[] = [];
      
      // Fetch latest reading for all stations
      for (const station of stations) {
        const { data: latestReading } = await supabase
          .from("aqi_readings")
          .select("aqi_value")
          .eq("station_id", station.id)
          .not("aqi_value", "is", null)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();
          
        if (latestReading && latestReading.aqi_value) {
          aqiValues.push(latestReading.aqi_value);
        }
      }
      
      if (aqiValues.length > 0) {
        cityAqiAverage = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReportsToday,
        mostAffectedDistrict,
        mostAffectedCount: maxCount,
        cityAqiAverage
      }
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
