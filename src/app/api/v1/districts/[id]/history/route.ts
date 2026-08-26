import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { ApiResponse, DistrictHistory, DistrictHistoryPoint } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = getSupabaseAdmin();

  // 1. Get district basic info
  const { data: district, error: districtError } = await supabase
    .from("districts")
    .select("name")
    .eq("id", id)
    .single();

  if (districtError || !district) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "District not found" } },
      { status: 404 }
    );
  }

  // 2. Fetch correlation history for the last 14 days
  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const { data: historyData, error: historyError } = await supabase
    .from("v_district_pollution_symptom_correlation")
    .select("*")
    .eq("district_id", id)
    .gte("date", twoWeeksAgo.toISOString().split('T')[0])
    .lte("date", today.toISOString().split('T')[0])
    .order("date", { ascending: true }); // Chronological order for charts

  if (historyError) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch history" } },
      { status: 500 }
    );
  }

  // 3. Fetch past 7 days rainfall from Open-Meteo
  const precipitationMap: Record<string, number> = {};
  try {
    const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=31.5204&longitude=74.3587&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto`);
    if (meteoRes.ok) {
      const meteoJson = await meteoRes.json();
      if (meteoJson.daily && meteoJson.daily.time && meteoJson.daily.precipitation_sum) {
        const times = meteoJson.daily.time as string[];
        const sums = meteoJson.daily.precipitation_sum as number[];
        times.forEach((dateStr, idx) => {
          precipitationMap[dateStr] = sums[idx] || 0;
        });
      }
    }
  } catch (err) {
    console.error("Failed to fetch past rainfall from Open-Meteo", err);
  }

  // 4. Map to DistrictHistoryPoint
  const points: DistrictHistoryPoint[] = (historyData || []).map(row => ({
    date: row.date,
    aqi: row.avg_aqi || 0,
    pm25: row.avg_pm25 || 0,
    symptom_report_count: row.total_symptom_reports || 0,
    has_aqi_data: row.avg_aqi !== null,
    precipitation_sum: precipitationMap[row.date] || 0,
  }));

  const history: DistrictHistory = {
    district_id: id,
    district_name: district.name,
    points,
  };

  const response: ApiResponse<DistrictHistory> = {
    success: true,
    data: history,
  };

  return NextResponse.json(response);
}
