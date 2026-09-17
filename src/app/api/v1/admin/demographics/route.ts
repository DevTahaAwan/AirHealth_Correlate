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

    const { data: profiles, error } = await supabaseAdmin
      .from("user_profiles")
      .select("home_district_id, conditions");

    if (error) {
      console.error("Supabase Error fetching demographics:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }

    const { data: districts, error: districtsError } = await supabase
      .from("districts")
      .select("id, name");

    if (districtsError || !districts) {
      console.error("Supabase Error fetching districts:", districtsError);
      return NextResponse.json({ success: false, error: "Failed to fetch districts" }, { status: 500 });
    }

    const districtMap = new Map(districts.map(d => [d.id, d.name]));

    const demographicMap: Record<string, Record<string, number>> = {};

    profiles?.forEach(profile => {
      const dId = profile.home_district_id;
      if (!dId) return;
      
      const districtName = districtMap.get(dId) || "Unknown District";

      if (!demographicMap[districtName]) {
        demographicMap[districtName] = {};
      }

      profile.conditions?.forEach((condition: string) => {
        if (condition === "none") return;
        const conditionName = condition.replace(/_/g, " ");
        demographicMap[districtName][conditionName] = (demographicMap[districtName][conditionName] || 0) + 1;
      });
    });

    const formattedData = Object.entries(demographicMap).map(([district, conditions]) => {
      return {
        district,
        conditions,
        totalVulnerable: Object.values(conditions).reduce((sum, val) => sum + val, 0)
      };
    }).sort((a, b) => b.totalVulnerable - a.totalVulnerable);

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error("Admin Demographics API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
