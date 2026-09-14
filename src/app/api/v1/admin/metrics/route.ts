import { NextResponse } from "next/server";
import { MockDataStore } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/utils/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allReports = await MockDataStore.getAllSymptomReports();
    const districts = await MockDataStore.getDistrictList();
    
    // Filter reports for today
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    const todayReports = allReports.filter(r => r.reported_at.startsWith(todayStr));
    const totalReportsToday = todayReports.length;
    
    // Most affected district
    const districtCounts: Record<string, number> = {};
    todayReports.forEach(r => {
      districtCounts[r.district_id] = (districtCounts[r.district_id] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostAffectedDistrictId = "";
    Object.entries(districtCounts).forEach(([dId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostAffectedDistrictId = dId;
      }
    });
    
    const mostAffectedDistrict = districts.find(d => d.district_id === mostAffectedDistrictId)?.name || "None";
    
    // City-wide AQI Average
    const validAqis = districts.filter(d => d.aqi !== null).map(d => d.aqi as number);
    const aqiAverage = validAqis.length > 0 
      ? Math.round(validAqis.reduce((a,b) => a+b, 0) / validAqis.length) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalReportsToday,
        mostAffectedDistrict,
        mostAffectedCount: maxCount,
        cityAqiAverage: aqiAverage
      }
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
