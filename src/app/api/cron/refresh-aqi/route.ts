export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { mockDistricts } from "@/data/districts";

// Define a type for the AQICN API response
interface AqicnResponse {
  status: string;
  data: {
    aqi: number;
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
    };
    time: {
      s: string; // "2023-11-20 08:00:00"
      iso: string; // "2023-11-20T08:00:00+05:00"
    };
  };
}

export async function GET(request: Request) {
  // 1. Basic auth check (if CRON_SECRET is set)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  
  // 2. Fetch all stations from Supabase
  const { data: stations, error: stationsError } = await supabase
    .from("stations")
    .select("id, district_id, external_station_id, name");

  if (stationsError || !stations) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch stations", details: stationsError },
      { status: 500 }
    );
  }

  // 3. Create a new ingestion run record
  const { data: runRecord, error: runError } = await supabase
    .from("ingestion_runs")
    .insert([{ started_at: new Date().toISOString(), trigger_source: "cron" }])
    .select("id")
    .single();

  if (runError || !runRecord) {
    return NextResponse.json(
      { success: false, error: "Failed to create ingestion run", details: runError },
      { status: 500 }
    );
  }

  const runId = runRecord.id;
  let successCount = 0;
  let fallbackCount = 0;
  let failCount = 0;

  // 4. Fetch the real base reading from AQICN for Lahore (US Consulate station)
  // Station @11423 is actively maintained and avoids the stale city-level feed.
  const token = process.env.AQICN_API_TOKEN;
  let baseAqi = 150; // Fallback default
  let basePm25: number | null = null;
  let basePm10: number | null = null;
  let baseTime = new Date().toISOString();
  let fetchSuccess = false;
  let staleDataSkipped = false;

  try {
    if (!token) throw new Error("AQICN_API_TOKEN is not set");
    const res = await fetch(`https://api.waqi.info/feed/@11423/?token=${token}`);
    const json = (await res.json()) as AqicnResponse;

    if (json.status === "ok") {
      baseAqi = json.data.aqi;
      basePm25 = json.data.iaqi?.pm25?.v ?? null;
      basePm10 = json.data.iaqi?.pm10?.v ?? null;
      
      // Parse the ISO timestamp from the response for age checking
      const isoString = json.data.time.iso || json.data.time.s;
      const recordedDate = new Date(isoString);
      baseTime = recordedDate.toISOString();

      // Defensive age check: reject data older than 24 hours
      const now = new Date();
      const diffInHours = (now.getTime() - recordedDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 24) {
        console.warn(
          `AQICN data is stale (recorded_at: ${baseTime}, age: ${diffInHours.toFixed(1)}h). Skipping insert.`
        );
        staleDataSkipped = true;
      } else {
        fetchSuccess = true;
      }
    }
  } catch (error) {
    console.error("Failed to fetch AQICN data:", error);
  }

  // If the data is stale, abort early — do not insert stale readings
  if (staleDataSkipped) {
    await supabase
      .from("ingestion_runs")
      .update({
        completed_at: new Date().toISOString(),
        stations_succeeded: 0,
        stations_fallback: 0,
        stations_failed: 0
      })
      .eq("id", runId);

    return NextResponse.json({
      success: false,
      error: "Stale data rejected",
      data: {
        run_id: runId,
        recorded_at: baseTime,
        message: "AQICN returned data older than 24 hours. No readings were inserted."
      }
    }, { status: 200 });
  }

  // 5. Process each station in bulk
  const ingestedAt = new Date().toISOString();
  
  const aqiReadingsPayload = stations.map(station => {
    const districtMock = mockDistricts.find(d => d.id === station.district_id);
    const offset = districtMock?.baseAqiOffset || 1.0;
    
    return {
      station_id: station.id,
      source: "aqicn",
      is_fallback_reading: !fetchSuccess,
      aqi_value: Math.max(0, Math.round(baseAqi * offset)),
      pm25_value: basePm25 !== null ? Math.max(0, Number((basePm25 * offset).toFixed(2))) : null,
      pm10_value: basePm10 !== null ? Math.max(0, Number((basePm10 * offset).toFixed(2))) : null,
      recorded_at: baseTime,
      ingested_at: ingestedAt
    };
  });

  const { data: readings, error: readingsError } = await supabase
    .from("aqi_readings")
    .insert(aqiReadingsPayload)
    .select("id, station_id");

  if (readingsError) {
    console.error("Bulk insert into aqi_readings failed:", readingsError);
  }

  const resultPayloads = stations.map(station => {
    const reading = readings?.find(r => r.station_id === station.id);
    let status = "failed";
    if (!readingsError && reading) {
      status = fetchSuccess ? "success" : "fallback_used";
      if (status === "success") successCount++;
      else fallbackCount++;
    } else {
      failCount++;
      // If unique constraint violated (already fetched for this hour), treat as success for counts
      if (readingsError?.code === '23505') {
         status = "success";
         successCount++;
         failCount--;
      }
    }
    
    return {
      ingestion_run_id: runId,
      station_id: station.id,
      status: status,
      aqi_reading_id: reading?.id || null,
      error_message: readingsError?.message || null
    };
  });

  await supabase.from("ingestion_run_station_results").insert(resultPayloads);

  // 6. Update the run record
  await supabase
    .from("ingestion_runs")
    .update({
      completed_at: new Date().toISOString(),
      stations_succeeded: successCount,
      stations_fallback: fallbackCount,
      stations_failed: failCount
    })
    .eq("id", runId);

  return NextResponse.json({
    success: true,
    data: {
      run_id: runId,
      stations_processed: stations.length,
      success: successCount,
      fallback: fallbackCount,
      failed: failCount,
      base_aqi_used: baseAqi
    }
  });
}
