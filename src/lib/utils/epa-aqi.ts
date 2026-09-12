// ============================================================================
// AirHealth Correlate — Strict US EPA AQI ↔ PM2.5 Breakpoint Calculator
// Implements the piecewise linear equation from EPA 454/B-18-007
//   I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
// ============================================================================

/**
 * A single EPA breakpoint row.
 * C_low/C_high = concentration range (µg/m³ or ppm)
 * I_low/I_high = AQI range
 */
interface Breakpoint {
  C_low: number;
  C_high: number;
  I_low: number;
  I_high: number;
}

// === PM2.5 Breakpoints (24-hour average, µg/m³) ===
// Source: US EPA Technical Assistance Document, Table 2 (revised 2024)
const PM25_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0.0,   C_high: 9.0,    I_low: 0,   I_high: 50  },
  { C_low: 9.1,   C_high: 35.4,   I_low: 51,  I_high: 100 },
  { C_low: 35.5,  C_high: 55.4,   I_low: 101, I_high: 150 },
  { C_low: 55.5,  C_high: 125.4,  I_low: 151, I_high: 200 },
  { C_low: 125.5, C_high: 225.4,  I_low: 201, I_high: 300 },
  { C_low: 225.5, C_high: 325.4,  I_low: 301, I_high: 500 },
];

// === PM10 Breakpoints (24-hour average, µg/m³) ===
const PM10_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0,   C_high: 54,   I_low: 0,   I_high: 50  },
  { C_low: 55,  C_high: 154,  I_low: 51,  I_high: 100 },
  { C_low: 155, C_high: 254,  I_low: 101, I_high: 150 },
  { C_low: 255, C_high: 354,  I_low: 151, I_high: 200 },
  { C_low: 355, C_high: 424,  I_low: 201, I_high: 300 },
  { C_low: 425, C_high: 604,  I_low: 301, I_high: 500 },
];

// === CO Breakpoints (8-hour average, ppm) ===
const CO_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0.0,  C_high: 4.4,   I_low: 0,   I_high: 50  },
  { C_low: 4.5,  C_high: 9.4,   I_low: 51,  I_high: 100 },
  { C_low: 9.5,  C_high: 12.4,  I_low: 101, I_high: 150 },
  { C_low: 12.5, C_high: 15.4,  I_low: 151, I_high: 200 },
  { C_low: 15.5, C_high: 30.4,  I_low: 201, I_high: 300 },
  { C_low: 30.5, C_high: 50.4,  I_low: 301, I_high: 500 },
];

// === SO₂ Breakpoints (1-hour average, ppb) ===
const SO2_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0,   C_high: 35,   I_low: 0,   I_high: 50  },
  { C_low: 36,  C_high: 75,   I_low: 51,  I_high: 100 },
  { C_low: 76,  C_high: 185,  I_low: 101, I_high: 150 },
  { C_low: 186, C_high: 304,  I_low: 151, I_high: 200 },
  { C_low: 305, C_high: 604,  I_low: 201, I_high: 300 },
  { C_low: 605, C_high: 1004, I_low: 301, I_high: 500 },
];

// === NO₂ Breakpoints (1-hour average, ppb) ===
const NO2_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0,    C_high: 53,    I_low: 0,   I_high: 50  },
  { C_low: 54,   C_high: 100,   I_low: 51,  I_high: 100 },
  { C_low: 101,  C_high: 360,   I_low: 101, I_high: 150 },
  { C_low: 361,  C_high: 649,   I_low: 151, I_high: 200 },
  { C_low: 650,  C_high: 1249,  I_low: 201, I_high: 300 },
  { C_low: 1250, C_high: 2049,  I_low: 301, I_high: 500 },
];

// === O₃ Breakpoints (8-hour average, ppm) ===
const O3_BREAKPOINTS: Breakpoint[] = [
  { C_low: 0.000, C_high: 0.054, I_low: 0,   I_high: 50  },
  { C_low: 0.055, C_high: 0.070, I_low: 51,  I_high: 100 },
  { C_low: 0.071, C_high: 0.085, I_low: 101, I_high: 150 },
  { C_low: 0.086, C_high: 0.105, I_low: 151, I_high: 200 },
  { C_low: 0.106, C_high: 0.200, I_low: 201, I_high: 300 },
];

// ─── Core EPA Piecewise Linear Equation ──────────────────────────────────────

/**
 * Calculates AQI from a pollutant concentration using the EPA equation:
 *   I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 *
 * @param concentration - The pollutant concentration value
 * @param breakpoints   - The EPA breakpoint table for that pollutant
 * @returns The calculated AQI (integer), or null if concentration is out of range
 */
function concentrationToAQI(concentration: number, breakpoints: Breakpoint[]): number | null {
  if (concentration < 0) return null;

  for (const bp of breakpoints) {
    if (concentration >= bp.C_low && concentration <= bp.C_high) {
      const aqi = ((bp.I_high - bp.I_low) / (bp.C_high - bp.C_low)) * (concentration - bp.C_low) + bp.I_low;
      return Math.round(aqi);
    }
  }

  // Beyond highest breakpoint — cap at 500
  const last = breakpoints[breakpoints.length - 1];
  if (concentration > last.C_high) return 500;

  return null;
}

/**
 * Reverse: Derives concentration from AQI using the same piecewise linear equation.
 *   C = ((C_high - C_low) / (I_high - I_low)) * (I - I_low) + C_low
 *
 * @param aqi        - The AQI value
 * @param breakpoints - The EPA breakpoint table for that pollutant
 * @returns The derived concentration, or null if AQI is out of range
 */
function aqiToConcentration(aqi: number, breakpoints: Breakpoint[]): number | null {
  if (aqi < 0) return null;

  for (const bp of breakpoints) {
    if (aqi >= bp.I_low && aqi <= bp.I_high) {
      const conc = ((bp.C_high - bp.C_low) / (bp.I_high - bp.I_low)) * (aqi - bp.I_low) + bp.C_low;
      return Math.round(conc * 10) / 10; // 1 decimal place
    }
  }

  // Beyond 500 — return the upper bound of the last breakpoint
  const last = breakpoints[breakpoints.length - 1];
  if (aqi > last.I_high) return last.C_high;

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Calculate AQI from PM2.5 concentration (µg/m³). Uses strict EPA breakpoints. */
export function calculateEPA_AQI(pm25: number): number | null {
  return concentrationToAQI(pm25, PM25_BREAKPOINTS);
}

/** Derive PM2.5 concentration (µg/m³) from AQI. Strict EPA reverse lookup. */
export function pm25FromAQI(aqi: number): number | null {
  return aqiToConcentration(aqi, PM25_BREAKPOINTS);
}

/** Calculate AQI from PM10 concentration (µg/m³). */
export function calculatePM10_AQI(pm10: number): number | null {
  return concentrationToAQI(pm10, PM10_BREAKPOINTS);
}

/** Derive PM10 concentration (µg/m³) from AQI. */
export function pm10FromAQI(aqi: number): number | null {
  return aqiToConcentration(aqi, PM10_BREAKPOINTS);
}

/** Calculate sub-AQI from CO concentration (ppm). */
export function calculateCO_AQI(co: number): number | null {
  return concentrationToAQI(co, CO_BREAKPOINTS);
}

/** Calculate sub-AQI from SO₂ concentration (ppb). */
export function calculateSO2_AQI(so2: number): number | null {
  return concentrationToAQI(so2, SO2_BREAKPOINTS);
}

/** Calculate sub-AQI from NO₂ concentration (ppb). */
export function calculateNO2_AQI(no2: number): number | null {
  return concentrationToAQI(no2, NO2_BREAKPOINTS);
}

/** Calculate sub-AQI from O₃ concentration (ppm). */
export function calculateO3_AQI(o3: number): number | null {
  return concentrationToAQI(o3, O3_BREAKPOINTS);
}

/**
 * Get a descriptive AQI category label and health advice.
 */
export function getAQICategory(aqi: number): { label: string; description: string; color: string } {
  if (aqi <= 50)  return { label: "Good",                     description: "Air quality is satisfactory, and air pollution poses little or no risk.",                                                    color: "#00e400" };
  if (aqi <= 100) return { label: "Moderate",                  description: "Air quality is acceptable. However, there may be a risk for some people who are unusually sensitive to air pollution.",     color: "#ffff00" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",      color: "#ff7e00" };
  if (aqi <= 200) return { label: "Unhealthy",                 description: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.", color: "#ff0000" };
  if (aqi <= 300) return { label: "Very Unhealthy",            description: "Health alert: The risk of health effects is increased for everyone.",                                                      color: "#8f3f97" };
  return            { label: "Hazardous",                      description: "Health warning of emergency conditions: everyone is more likely to be affected.",                                          color: "#7e0023" };
}
