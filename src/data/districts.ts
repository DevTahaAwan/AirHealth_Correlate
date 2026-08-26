import { District } from "@/lib/types";

// Mock data for Lahore Districts
// For a real application, boundary_geojson would contain actual GeoJSON Polygon/MultiPolygon data.
// We provide simple centroid coordinates for demonstration purposes.

export const mockDistricts: (District & { baseAqiOffset: number })[] = [
  {
    id: "dst_ravi",
    name: "Ravi Town",
    slug: "ravi-town",
    district_code: "LHR-01",
    centroid_lat: 31.602,
    centroid_lng: 74.312,
    display_order: 1,
    baseAqiOffset: 1.10, // +10%
    boundary_geojson: null,
  },
  {
    id: "dst_shalimar",
    name: "Shalimar Town",
    slug: "shalimar-town",
    district_code: "LHR-02",
    centroid_lat: 31.579,
    centroid_lng: 74.364,
    display_order: 2,
    baseAqiOffset: 1.08, // +8%
    boundary_geojson: null,
  },
  {
    id: "dst_wagah",
    name: "Wagah Town",
    slug: "wagah-town",
    district_code: "LHR-03",
    centroid_lat: 31.583,
    centroid_lng: 74.498,
    display_order: 3,
    baseAqiOffset: 0.90, // -10% (Suburban/Rural border)
    boundary_geojson: null,
  },
  {
    id: "dst_aziz_bhatti",
    name: "Aziz Bhatti Town",
    slug: "aziz-bhatti-town",
    district_code: "LHR-04",
    centroid_lat: 31.554,
    centroid_lng: 74.406,
    display_order: 4,
    baseAqiOffset: 1.05, // +5%
    boundary_geojson: null,
  },
  {
    id: "dst_data_ganj_bakhsh",
    name: "Data Ganj Bakhsh Town",
    slug: "data-ganj-bakhsh-town",
    district_code: "LHR-05",
    centroid_lat: 31.564,
    centroid_lng: 74.316,
    display_order: 5,
    baseAqiOffset: 1.15, // +15% (Extremely dense inner city)
    boundary_geojson: null,
  },
  {
    id: "dst_gulberg",
    name: "Gulberg Town",
    slug: "gulberg-town",
    district_code: "LHR-06",
    centroid_lat: 31.517,
    centroid_lng: 74.346,
    display_order: 6,
    baseAqiOffset: 1.12, // +12% (Commercial hub)
    boundary_geojson: null,
  },
  {
    id: "dst_samanabad",
    name: "Samanabad Town",
    slug: "samanabad-town",
    district_code: "LHR-07",
    centroid_lat: 31.543,
    centroid_lng: 74.293,
    display_order: 7,
    baseAqiOffset: 1.08, // +8%
    boundary_geojson: null,
  },
  {
    id: "dst_iqbal",
    name: "Iqbal Town",
    slug: "iqbal-town",
    district_code: "LHR-08",
    centroid_lat: 31.512,
    centroid_lng: 74.283,
    display_order: 8,
    baseAqiOffset: 1.05, // +5%
    boundary_geojson: null,
  },
  {
    id: "dst_nishtar",
    name: "Nishtar Town",
    slug: "nishtar-town",
    district_code: "LHR-09",
    centroid_lat: 31.439,
    centroid_lng: 74.364,
    display_order: 9,
    baseAqiOffset: 1.10, // +10% (Industrial/residential mix)
    boundary_geojson: null,
  },
  {
    id: "dst_cantt",
    name: "Lahore Cantonment (Cantt)",
    slug: "lahore-cantonment",
    district_code: "LHR-10",
    centroid_lat: 31.520,
    centroid_lng: 74.382,
    display_order: 10,
    baseAqiOffset: 0.95, // -5% (Greener, military controlled)
    boundary_geojson: null,
  },
  {
    id: "dst_dha",
    name: "DHA Lahore",
    slug: "dha-lahore",
    district_code: "LHR-11",
    centroid_lat: 31.472,
    centroid_lng: 74.409,
    display_order: 11,
    baseAqiOffset: 0.92, // -8% (Planned, greener)
    boundary_geojson: null,
  },
  {
    id: "dst_model_town",
    name: "Model Town",
    slug: "model-town",
    district_code: "LHR-12",
    centroid_lat: 31.482,
    centroid_lng: 74.321,
    display_order: 12,
    baseAqiOffset: 0.98, // -2% (Trees, but central)
    boundary_geojson: null,
  },
  {
    id: "dst_johar",
    name: "Johar Town",
    slug: "johar-town",
    district_code: "LHR-13",
    centroid_lat: 31.465,
    centroid_lng: 74.280,
    display_order: 13,
    baseAqiOffset: 1.05, // +5% (High traffic)
    boundary_geojson: null,
  },
  {
    id: "dst_bahria",
    name: "Bahria Town",
    slug: "bahria-town",
    district_code: "LHR-14",
    centroid_lat: 31.378,
    centroid_lng: 74.185,
    display_order: 14,
    baseAqiOffset: 0.85, // -15% (Southward, well maintained)
    boundary_geojson: null,
  }
];
