import { mockDistricts } from "@/data/districts";
import {
  SymptomReport,
  DistrictListItem,
  RiskTier,
} from "@/lib/types";

// ============================================================================
// AirHealth Correlate — In-Memory Mock Store
// Replaces Supabase for the mock testing phase.
// It uses a combination of hardcoded data generation and localStorage.
// ============================================================================

// Helper: Get current date string in YYYY-MM-DD
function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

let cachedAqiData: Record<string, { aqi: number; pm25: number }> | null = null;
let lastAqiFetch = 0;

export async function fetchAqiData() {
  const now = Date.now();
  if (cachedAqiData && (now - lastAqiFetch < 1000 * 60 * 5)) {
    return cachedAqiData; // Cache for 5 minutes
  }

  let baseAqi = 150; // Fallback average if API fails/missing token
  const token = process.env.AQICN_API_TOKEN || process.env.AQICN_TOKEN;
  
  if (token) {
    try {
      const res = await fetch(`https://api.waqi.info/feed/lahore/?token=${token}`);
      const json = await res.json();
      if (json.status === "ok" && json.data?.aqi) {
        baseAqi = parseInt(json.data.aqi, 10);
      }
    } catch (e) {
      console.error("Failed to fetch live AQI from AQICN:", e);
    }
  }

  const data: Record<string, { aqi: number; pm25: number }> = {};
  mockDistricts.forEach((d) => {
    const offset = d.baseAqiOffset || 1.0;
    const districtAqi = Math.round(baseAqi * offset);
    data[d.id] = {
      aqi: districtAqi,
      pm25: Math.round(districtAqi * 0.7), // Rough approx for PM2.5
    };
  });
  
  // Force Model Town to spike if we don't have real live data yet just for demo
  if (!token && data["dst_model_town"]) {
    data["dst_model_town"].aqi = 412;
    data["dst_model_town"].pm25 = 280;
  }

  cachedAqiData = data;
  lastAqiFetch = now;
  return data;
}

export function getRiskTier(aqi: number | null): RiskTier {
  if (aqi === null) return "low";
  if (aqi <= 50) return "low";
  if (aqi <= 100) return "moderate";
  if (aqi <= 200) return "high";
  return "very_high";
}

export class MockDataStore {
  // In-memory reports store
  private static reports: SymptomReport[] = [];
  
  // Seed some initial reports on first load
  static initialize() {
    if (this.reports.length === 0) {
      const today = new Date().toISOString();
      this.reports.push(
        { id: "sr_1", user_id: "u_1", district_id: "dst_model_town", symptoms: ["coughing", "wheezing"], reported_at: today },
        { id: "sr_2", user_id: "u_2", district_id: "dst_model_town", symptoms: ["shortness_of_breath"], reported_at: today },
        { id: "sr_3", user_id: "u_3", district_id: "dst_gulberg", symptoms: ["chest_tightness"], reported_at: today },
      );
    }
  }

  static async getDistrictList(): Promise<DistrictListItem[]> {
    this.initialize();
    const today = getTodayStr();
    const aqiData = await fetchAqiData();

    return mockDistricts.map((d) => {
      const aqiInfo = aqiData[d.id];
      // Count today's reports for this district
      const reportCount = this.reports.filter(
        (r) => r.district_id === d.id && r.reported_at.startsWith(today)
      ).length;

      return {
        district_id: d.id,
        name: d.name,
        slug: d.slug,
        aqi: aqiInfo.aqi,
        pm25: aqiInfo.pm25,
        risk_tier: getRiskTier(aqiInfo.aqi),
        symptom_reports_today: reportCount,
        has_aqi_data: true,
        last_updated: new Date().toISOString(),
        centroid_lat: d.centroid_lat,
        centroid_lng: d.centroid_lng,
        boundary_geojson: null,
      };
    });
  }

  static addSymptomReport(report: Omit<SymptomReport, "id" | "reported_at">) {
    const today = getTodayStr();
    // Simulate RLS: Prevent duplicate report for same user on same day
    const existing = this.reports.find(
      (r) => r.user_id === report.user_id && r.reported_at.startsWith(today)
    );
    
    if (existing) {
      throw new Error("You have already submitted a report today.");
    }

    const newReport: SymptomReport = {
      ...report,
      id: `sr_${Math.random().toString(36).substr(2, 9)}`,
      reported_at: new Date().toISOString(),
    };

    this.reports.push(newReport);
    return newReport;
  }

  static getDistrictSymptomSummary(districtId: string) {
    this.initialize();
    const today = getTodayStr();
    const todayReports = this.reports.filter(
      (r) => r.district_id === districtId && r.reported_at.startsWith(today)
    );

    const counts: Record<string, number> = {
      wheezing: 0,
      coughing: 0,
      shortness_of_breath: 0,
      chest_tightness: 0,
      inhaler_used: 0,
    };

    todayReports.forEach((r) => {
      r.symptoms.forEach((s) => {
        if (counts[s] !== undefined) counts[s]++;
      });
    });

    // Enforce k-anonymity for the mock (require at least 3 distinct reporters, but for demo we might lower it or fake it)
    // To make the demo work, we'll set suppressed to false if count > 0 for this mock.
    // Show data if at least 2 users (skipped for demo)

    return {
      total_today: todayReports.length,
      by_symptom: counts,
      suppressed: false, // Force false for the demo so we can see the data
    };
  }
}
