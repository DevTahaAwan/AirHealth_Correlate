import * as cheerio from 'cheerio';

export interface EPA_ScrapeResult {
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  co: number | null;
  so2: number | null;
  no2: number | null;
  o3: number | null;
}

export async function scrapePunjabEPA(): Promise<EPA_ScrapeResult> {
  const url = "https://aqi.punjab.gov.pk/lahore";
  
  // 1. Fetch with 6-second timeout and proper headers
  const response = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`EPD Punjab API returned status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // 2. Extract wire:snapshot attribute
  const snapshotAttr = $('[wire\\:snapshot]').attr('wire:snapshot');
  if (!snapshotAttr) {
    throw new Error("Could not find wire:snapshot on EPD Punjab page");
  }

  // Cheerio's .attr() automatically unescapes HTML entities, but let's be safe
  // if for some reason it didn't unescape everything.
  const decodedSnapshot = snapshotAttr
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  // 3. Parse JSON
  let snapshotData;
  try {
    snapshotData = JSON.parse(decodedSnapshot);
  } catch (error) {
    throw new Error("Failed to parse wire:snapshot JSON from EPD Punjab");
  }

  // 4. Extract data safely
  try {
    const lahoreData = snapshotData.data.pageData[0].lahoreData[0];
    const stationsData = lahoreData.stations.flat(Infinity);

    // Filter valid stations
    const validStations = stationsData.filter((s: any) => s && s.station_id);

    if (validStations.length === 0) {
      throw new Error("No valid stations found in EPD Punjab data");
    }

    // Calculate averages across all valid stations
    let totalAqi = 0, totalPm25 = 0, totalPm10 = 0;
    let totalCo = 0, totalSo2 = 0, totalNo2 = 0, totalO3 = 0;
    
    let pm25Count = 0, pm10Count = 0, coCount = 0;
    let so2Count = 0, no2Count = 0, o3Count = 0, aqiCount = 0;

    for (const station of validStations) {
      if (station.aqi !== undefined && station.aqi !== null) {
        totalAqi += Number(station.aqi);
        aqiCount++;
      }
      if (station.pm25 !== undefined && station.pm25 !== null) {
        totalPm25 += Number(station.pm25);
        pm25Count++;
      }
      if (station.pm10 !== undefined && station.pm10 !== null) {
        totalPm10 += Number(station.pm10);
        pm10Count++;
      }
      if (station.co !== undefined && station.co !== null) {
        totalCo += Number(station.co);
        coCount++;
      }
      if (station.so2 !== undefined && station.so2 !== null) {
        totalSo2 += Number(station.so2);
        so2Count++;
      }
      if (station.no2 !== undefined && station.no2 !== null) {
        totalNo2 += Number(station.no2);
        no2Count++;
      }
      if (station.o3 !== undefined && station.o3 !== null) {
        totalO3 += Number(station.o3);
        o3Count++;
      }
    }

    return {
      // Use city-wide average if provided, otherwise fallback to station average
      aqi: lahoreData.average_aqi ? Number(lahoreData.average_aqi) : (aqiCount > 0 ? Math.round(totalAqi / aqiCount) : 0),
      pm25: pm25Count > 0 ? Number((totalPm25 / pm25Count).toFixed(2)) : null,
      pm10: pm10Count > 0 ? Number((totalPm10 / pm10Count).toFixed(2)) : null,
      co: coCount > 0 ? Number((totalCo / coCount).toFixed(2)) : null,
      so2: so2Count > 0 ? Number((totalSo2 / so2Count).toFixed(2)) : null,
      no2: no2Count > 0 ? Number((totalNo2 / no2Count).toFixed(2)) : null,
      o3: o3Count > 0 ? Number((totalO3 / o3Count).toFixed(2)) : null,
    };
  } catch (error: any) {
    throw new Error(`Failed to extract EPD Punjab data structure: ${error.message}`);
  }
}
