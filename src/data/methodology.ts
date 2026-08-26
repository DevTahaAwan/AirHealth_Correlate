import { MethodologyResponse } from "@/lib/types";

export const mockMethodologyData: MethodologyResponse = {
  data_sources: [
    {
      id: "src_openaq",
      category: "aqi_data",
      name: "OpenAQ API",
      url: "https://openaq.org",
      description: "Aggregated open air quality data.",
      retrieved_date: new Date().toISOString(),
      display_order: 1,
    },
    {
      id: "src_aqicn",
      category: "aqi_data",
      name: "WAQI (aqicn.org)",
      url: "https://aqicn.org",
      description: "Real-time Air Quality Index data.",
      retrieved_date: new Date().toISOString(),
      display_order: 2,
    },
    {
      id: "src_who",
      category: "methodology",
      name: "WHO AirQ+",
      url: "https://www.who.int/europe/tools-and-initiatives/airq",
      description: "Software tool for health risk assessment of air pollution.",
      retrieved_date: new Date().toISOString(),
      display_order: 3,
    },
  ],
  who_coefficient_info: {
    name: "WHO Global Air Quality Guidelines",
    version: "2021 Update",
    source_citation:
      "World Health Organization. (2021). WHO global air quality guidelines.",
    source_url:
      "https://apps.who.int/iris/handle/10665/345329",
    baseline_safe_minutes: 120, // Baseline for standard healthy adult at moderate AQI
  },
  lag_effect_citations: [
    {
      name: "Short-term PM2.5 Exposure and Respiratory Admissions",
      lag_hours_min: 24,
      lag_hours_max: 48,
      trigger_aqi_threshold: 200,
      source_citation:
        "Dominici F, et al. Fine particulate air pollution and hospital admission for cardiovascular and respiratory diseases. JAMA. 2006.",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/16522834/",
    },
  ],
  symptom_report_disclaimer:
    "Community signal data is self-reported by users and is not verified by medical professionals. It serves as an early indicator of localized respiratory stress.",
  safe_time_disclaimer:
    "Safe exposure times are estimates based on WHO guidelines and generic physiological models. Individuals should consult healthcare providers for personalized advice.",
  surge_disclaimer:
    "Surge advisories indicate an elevated statistical likelihood of increased respiratory hospital admissions based on historical data correlations, not a definitive prediction.",
};
