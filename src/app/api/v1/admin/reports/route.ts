import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/utils/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: allReports, error: reportsError } = await supabaseAdmin
      .from("symptom_reports")
      .select("id, district_id, symptom, severity, reported_at");

    if (reportsError || !allReports) {
      return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
    }

    const { data: districts, error: districtsError } = await supabaseAdmin
      .from("districts")
      .select("id, name, centroid_lat, centroid_lng");

    if (districtsError || !districts) {
      return NextResponse.json({ success: false, error: "Failed to fetch districts" }, { status: 500 });
    }

    const reportsWithLocation = allReports.map(report => {
      const district = districts.find(d => d.id === report.district_id);
      
      // Add some random jitter so points don't all stack exactly on the district center
      const jitter = 0.01;
      const lat = district ? district.centroid_lat + (Math.random() - 0.5) * jitter : 31.5204;
      const lng = district ? district.centroid_lng + (Math.random() - 0.5) * jitter : 74.3587;
      
      return {
        id: report.id,
        district_id: report.district_id,
        district_name: district?.name || "Unknown",
        symptom: report.symptom,
        severity_bucket: report.severity >= 7 ? "severe" : report.severity >= 4 ? "moderate" : "mild",
        timestamp: report.reported_at,
        lat,
        lng
      };
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
