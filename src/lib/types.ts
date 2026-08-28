// ============================================================
// AirHealth Correlate — Core TypeScript Types
// Maps directly to schema.sql entities and API response shapes
// ============================================================

// === Enums matching Postgres custom types ===

export type RiskTier = "low" | "moderate" | "high" | "very_high";

export type SymptomType =
  | "wheezing"
  | "coughing"
  | "shortness_of_breath"
  | "chest_tightness"
  | "inhaler_used"
  | "eye_irritation";

export type RespiratoryCondition =
  | "asthma"
  | "copd"
  | "bronchitis"
  | "allergic_rhinitis"
  | "other_respiratory"
  | "none";

export type SurgeAlertStatus = "active" | "resolved" | "false_positive";

export type DataSourceType =
  | "aqicn"
  | "openaq"
  | "open_data_pakistan"
  | "who_airq_plus"
  | "punjab_govt_dashboard"
  | "medical_literature";

export type SourceCategory =
  | "aqi_data"
  | "population_data"
  | "methodology"
  | "boundary_data"
  | "medical_lag_model";

// === Core Domain Entities ===

export interface District {
  id: string;
  name: string;
  slug: string;
  district_code: string | null;
  boundary_geojson: GeoJSON.Feature | null;
  centroid_lat: number;
  centroid_lng: number;
  display_order: number;
}

export interface Station {
  id: string;
  district_id: string;
  external_source: DataSourceType;
  external_station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface AqiReading {
  id: string;
  station_id: string;
  source: DataSourceType;
  is_fallback_reading: boolean;
  aqi_value: number;
  pm25_value: number | null;
  pm10_value: number | null;
  recorded_at: string;
  ingested_at: string;
}

export interface SymptomReport {
  id: string;
  user_id: string;
  district_id: string;
  symptoms: SymptomType[];
  severity: number;
  duration: string;
  reported_at: string;
}

export interface DistrictSymptomAggregate {
  district_id: string;
  report_date: string;
  symptom: SymptomType;
  report_count: number;
  distinct_reporter_count: number;
  suppressed: boolean;
}

export interface SurgePrediction {
  id: string;
  district_id: string;
  triggering_aqi_value: number;
  predicted_window_start: string;
  predicted_window_end: string;
  predicted_admission_increase_pct: number;
  status: SurgeAlertStatus;
  basis_citation: string;
}

export interface UserHealthProfile {
  user_id: string;
  conditions: RespiratoryCondition[];
  home_district_id: string | null;
}

export interface DataSource {
  id: string;
  category: SourceCategory;
  name: string;
  url: string | null;
  description: string | null;
  retrieved_date: string;
  display_order: number;
}

// === API Response Shapes ===

export interface DistrictListItem {
  district_id: string;
  name: string;
  slug: string;
  aqi: number | null;
  aqi_value?: number | null;
  pm25: number | null;
  pm25_value?: number | null;
  pm10_value?: number | null;
  risk_tier: RiskTier | null;
  symptom_reports_today: number;
  has_aqi_data: boolean;
  last_updated: string | null;
  centroid_lat: number;
  centroid_lng: number;
  boundary_geojson: GeoJSON.Feature | null;
}

export interface DistrictDetail extends DistrictListItem {
  advisory_text: string;
  symptom_report_summary: SymptomReportSummary;
  population: number | null;
  rain_expected?: boolean | null;
  weather?: {
    temperature: number;
    windSpeed: number;
    precipitation: number;
  };
  hourly_forecast?: { time: string; temp: number }[];
}

export interface SymptomReportSummary {
  total_today: number;
  by_symptom: Record<SymptomType, number>;
  suppressed: boolean;
}

export interface DistrictHistoryPoint {
  date: string;
  aqi: number | null;
  pm25: number | null;
  symptom_report_count: number;
  has_aqi_data: boolean;
  precipitation_sum?: number | null;
}

export interface DistrictHistory {
  district_id: string;
  district_name: string;
  points: DistrictHistoryPoint[];
}

export interface SafeTimeResult {
  district_id: string;
  safe_minutes: number;
  risk_tier: RiskTier;
  basis: "personal_health_profile" | "general_vulnerable_group";
  aqi_value: number | null;
  conditions_applied: RespiratoryCondition[];
  disclaimer: string;
}

export interface SurgeFlagItem {
  district_id: string;
  district_name: string;
  flag_status: "none" | "elevated_likelihood";
  triggered_by_date: string | null;
  triggering_aqi: number | null;
  expected_window_start: string | null;
  expected_window_end: string | null;
  predicted_increase_pct: number | null;
  basis_citation: string | null;
}

export interface MethodologyResponse {
  data_sources: DataSource[];
  who_coefficient_info: {
    name: string;
    version: string;
    source_citation: string;
    source_url: string | null;
    baseline_safe_minutes: number;
  };
  lag_effect_citations: {
    name: string;
    lag_hours_min: number;
    lag_hours_max: number;
    trigger_aqi_threshold: number;
    source_citation: string;
    source_url: string | null;
  }[];
  symptom_report_disclaimer: string;
  safe_time_disclaimer: string;
  surge_disclaimer: string;
}

// === API Wrapper ===

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    last_updated: string;
    is_stale: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

