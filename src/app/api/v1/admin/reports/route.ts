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
    
    // In a real app, this would query a real DB. We just return the mock data for now.
    // The admin portal heatmap needs latitude/longitude for each report.
    // Our mock data has district_id, we need to join with district coords.
    const districts = await MockDataStore.getDistrictList();
    
    const reportsWithLocation = allReports.flatMap(report => {
      const district = districts.find(d => d.district_id === report.district_id);
      
      // Add some random jitter so points don't all stack exactly on the district center
      const jitter = 0.02; // approx 2km
      const lat = district ? district.centroid_lat + (Math.random() - 0.5) * jitter : 31.5204;
      const lng = district ? district.centroid_lng + (Math.random() - 0.5) * jitter : 74.3587;
      
      return report.symptoms.map(symptom => ({
        id: `${report.id}_${symptom}`,
        district_id: report.district_id,
        district_name: district?.name || "Unknown",
        symptom,
        severity: report.severity >= 7 ? "severe" : report.severity >= 4 ? "moderate" : "mild",
        timestamp: report.reported_at,
        lat,
        lng
      }));
    });

    return NextResponse.json({
      success: true,
      data: reportsWithLocation,
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
