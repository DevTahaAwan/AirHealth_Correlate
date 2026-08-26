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
  
  // 2. Fetch all active stations from Supabase
  const { data: stations, error: stationsError } = await supabase
    .from("stations")
    .select("id, district_id, external_station_id, name")
    .eq("is_active", true);

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

  // 4. Fetch the real base reading from AQICN for Lahore
  // In a real multi-station setup, we'd loop through each station's external_station_id.
  // Here, we fetch the city-level feed and apply our "Hybrid Offset" for the hackathon.
  const token = process.env.AQICN_API_TOKEN;
  let baseAqi = 150; // Fallback default
  let basePm25: number | null = null;
  let basePm10: number | null = null;
  let baseTime = new Date().toISOString();
  let fetchSuccess = false;

  try {
    if (!token) throw new Error("AQICN_API_TOKEN is not set");
    const res = await fetch(`https://api.waqi.info/feed/lahore/?token=${token}`);
    const json = (await res.json()) as AqicnResponse;

    if (json.status === "ok") {
      baseAqi = json.data.aqi;
      basePm25 = json.data.iaqi?.pm25?.v ?? null;
      basePm10 = json.data.iaqi?.pm10?.v ?? null;
      
      // Try to parse the AQICN time, otherwise use now
      try {
         baseTime = new Date(json.data.time.s).toISOString();
      } catch {
         // ignore
      }
      fetchSuccess = true;
    }
  } catch (error) {
    console.error("Failed to fetch AQICN data:", error);
  }

  // 5. Process each station
  for (const station of stations) {
    // Find the offset from our mock data based on district ID
    const districtMock = mockDistricts.find(d => d.id === station.district_id);
    const offset = districtMock?.baseAqiOffset || 1.0;
    
    // Apply offset for this specific station's reading
    const stationAqi = Math.max(0, Math.round(baseAqi * offset));
    const stationPm25 = basePm25 !== null ? Math.max(0, Number((basePm25 * offset).toFixed(2))) : null;
    const stationPm10 = basePm10 !== null ? Math.max(0, Number((basePm10 * offset).toFixed(2))) : null;

    // Insert reading
    const { data: reading, error: readingError } = await supabase
      .from("aqi_readings")
      .insert([{
        station_id: station.id,
        source: "aqicn",
        is_fallback_reading: !fetchSuccess,
        aqi_value: stationAqi,
        pm25_value: stationPm25,
        pm10_value: stationPm10,
        recorded_at: baseTime,
        ingested_at: new Date().toISOString()
      }])
      .select("id")
      .single();

    // Log the result for this station
    let status = "failed";
    if (!readingError && reading) {
       status = fetchSuccess ? "success" : "fallback_used";
       if (status === "success") successCount++;
       else fallbackCount++;
    } else {
       failCount++;
       // If unique constraint violated (already fetched for this hour), treat as success for counts
       if (readingError?.code === '23505') {
          status = "success";
          successCount++;
          failCount--;
       }
    }

    await supabase.from("ingestion_run_station_results").insert([{
      ingestion_run_id: runId,
      station_id: station.id,
      status: status,
      aqi_reading_id: reading?.id || null,
      error_message: readingError?.message || null
    }]);
  }

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
