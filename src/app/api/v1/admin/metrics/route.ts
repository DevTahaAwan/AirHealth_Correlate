import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/utils/admin-auth";
import { pm25FromAQI } from "@/lib/utils/epa-aqi";
import { calculateDLNM, type DLNMResult } from "@/lib/services/dlnm-engine";
import { generate72HourForecast, type WeatherForecastInput } from "@/lib/services/aqi-forecaster";

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

    // 4. Fetch Weather Data (Lahore Central)
    const lat = 31.5204;
    const lng = 74.3587;
    let weatherContext = { temperature: 28, humidity: 55, windSpeed: 0, precipitation: 0 };
    let predictiveForecast = undefined;
    let dlnmResult: DLNMResult | undefined;

    try {
      const meteoRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=auto&forecast_days=4`
      );
      
      if (meteoRes.ok) {
        const meteoJson = await meteoRes.json();
        if (meteoJson.current) {
          weatherContext = {
            temperature: meteoJson.current.temperature_2m || 28,
            humidity: meteoJson.current.relative_humidity_2m || 55,
            windSpeed: meteoJson.current.wind_speed_10m || 0,
            precipitation: meteoJson.current.precipitation || 0,
          };
        }
        
        const currentPm25 = (cityAqiAverage > 0 ? pm25FromAQI(cityAqiAverage) : null) ?? 55.0;
        
        // Predictive Forecast
        if (meteoJson.daily && meteoJson.daily.time) {
          const inputs: WeatherForecastInput[] = [];
          for (let i = 1; i <= 3; i++) {
            if (meteoJson.daily.time[i]) {
              inputs.push({
                date: meteoJson.daily.time[i],
                minTemp: meteoJson.daily.temperature_2m_min[i],
                maxTemp: meteoJson.daily.temperature_2m_max[i],
                windSpeed: meteoJson.daily.wind_speed_10m_max[i],
                precipitation: meteoJson.daily.precipitation_sum[i],
              });
            }
          }
          predictiveForecast = generate72HourForecast(currentPm25, inputs);
        }

        // DLNM - Simplified 6-day history (using current as baseline with slight decay)
        // For a true dashboard we'd query historical averages, but for real-time we'll approximate the past 6 days
        // based on the current city average.
        const pm25History = [];
        let historicalPm25 = currentPm25;
        for (let d = 0; d < 6; d++) {
          pm25History.push(historicalPm25);
          historicalPm25 = historicalPm25 * 0.95; // 5% decay assumption for past days
        }

        dlnmResult = calculateDLNM({
          pm25History,
          temperature: weatherContext.temperature,
          humidity: weatherContext.humidity,
          monthIndex: new Date().getMonth(),
        });
      }
    } catch (err) {
      console.error("Failed to generate predictive metrics", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReportsToday,
        mostAffectedDistrict,
        mostAffectedCount: maxCount,
        cityAqiAverage,
        dlnm: dlnmResult,
        predictive_forecast: predictiveForecast
      }
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
