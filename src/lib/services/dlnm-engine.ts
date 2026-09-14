// ============================================================
// DLNM Statistical Linkage Engine
// Distributed Lag Non-linear Model for cumulative respiratory risk
// Based on Gasparrini et al. methodology
// ============================================================

// ─── Interfaces ──────────────────────────────────────────────

export interface LaggedExposureData {
  pm25History: number[]; // Array of last 6 days [t0, t1, t2, t3, t4, t5]
  temperature: number;   // Current temperature in °C
  humidity: number;      // Current relative humidity in %
  monthIndex: number;    // 0-11 (January = 0)
}

export interface DLNMResult {
  unlaggedRR: number;            // Lag-0 only relative risk
  cumulativeRR: number;          // Full 5-day cumulative distributed lag RR
  adjustedRR: number;            // Confounder-adjusted cumulative RR
  attributableFraction: number;  // (adjustedRR - 1) / adjustedRR * 100
  lagContributions: {
    day: string;
    weight: number;
    pm25: number;
    effect: number;
  }[];
  confounders: {
    temperatureStress: string;
    humidityFactor: string;
    seasonalBaseline: string;
  };
}

// ─── Model Constants ─────────────────────────────────────────

/** WHO Annual Mean Guideline for PM2.5 (µg/m³) */
const COUNTERFACTUAL_THRESHOLD = 15.0;

/** Log-linear coefficient per µg/m³ above threshold */
const BASE_BETA = 0.008;

/**
 * Polynomial lag weights (sum = 1.0).
 * Peak at Day 1 reflects the biological inflammatory response delay.
 */
const LAG_WEIGHTS: number[] = [
  0.15, // Day 0 — same-day acute
  0.32, // Day 1 — peak inflammation
  0.26, // Day 2 — sustained response
  0.15, // Day 3 — tapering
  0.08, // Day 4 — residual
  0.04, // Day 5 — tail
];

// ─── Confounder Functions ────────────────────────────────────

/**
 * Temperature stress multiplier.
 * Cold stress: respiratory morbidity increases below 18 °C.
 * Heat stress: respiratory morbidity increases above 34 °C.
 */
function temperatureMultiplier(tempC: number): { factor: number; label: string } {
  if (tempC < 18) {
    const factor = 1 + (18 - tempC) * 0.012;
    return { factor, label: `Cold stress (${tempC.toFixed(1)}°C)` };
  }
  if (tempC > 34) {
    const factor = 1 + (tempC - 34) * 0.015;
    return { factor, label: `Heat stress (${tempC.toFixed(1)}°C)` };
  }
  return { factor: 1.0, label: `Neutral (${tempC.toFixed(1)}°C)` };
}

/**
 * Humidity confounder.
 * Extreme low (<35%) or high (>75%) humidity aggravates airway irritation
 * and indicates atmospheric stagnation.
 */
function humidityMultiplier(humidityPct: number): { factor: number; label: string } {
  if (humidityPct < 35 || humidityPct > 75) {
    return { factor: 1.05, label: `Adjusted (${Math.round(humidityPct)}%)` };
  }
  return { factor: 1.0, label: `Normal (${Math.round(humidityPct)}%)` };
}

/**
 * Seasonal baseline multiplier.
 * November (10) through February (1) represents the Lahore winter smog season.
 */
function seasonalMultiplier(monthIndex: number): { factor: number; label: string } {
  // Winter smog months: November (10), December (11), January (0), February (1)
  const isWinterSmog = monthIndex >= 10 || monthIndex <= 1;
  if (isWinterSmog) {
    return { factor: 1.10, label: "Winter Smog Season (×1.10)" };
  }
  return { factor: 1.0, label: "Non-smog baseline" };
}

// ─── Core DLNM Calculation ───────────────────────────────────

/**
 * Calculate Distributed Lag Non-linear Model risk estimates.
 *
 * Mathematical framework:
 *   For each lag day k (0..5):
 *     excess_k = max(0, PM2.5_k - X₀)
 *     effect_k = w_k × β × excess_k
 *   
 *   cumulativeLogRR = Σ effect_k
 *   cumulativeRR = exp(cumulativeLogRR)
 *   adjustedRR = cumulativeRR × tempFactor × humidityFactor × seasonFactor
 *   AF = (adjustedRR − 1) / adjustedRR × 100
 */
export function calculateDLNM(input: LaggedExposureData): DLNMResult {
  const { pm25History, temperature, humidity, monthIndex } = input;

  // Ensure we have exactly 6 data points (pad with decay if fewer)
  const history = padPm25History(pm25History);

  // 1. Calculate lag-specific contributions
  const lagContributions = history.map((pm25, i) => {
    const excess = Math.max(0, pm25 - COUNTERFACTUAL_THRESHOLD);
    const effect = LAG_WEIGHTS[i] * BASE_BETA * excess;
    return {
      day: `Day ${i}`,
      weight: LAG_WEIGHTS[i],
      pm25: Number(pm25.toFixed(1)),
      effect: Number(effect.toFixed(6)),
    };
  });

  // 2. Unlagged (Day-0 only) relative risk
  const unlaggedLogRR = lagContributions[0].effect / LAG_WEIGHTS[0]; // Full β × excess for day 0
  const unlaggedRR = Math.exp(unlaggedLogRR);

  // 3. Cumulative distributed lag relative risk
  const cumulativeLogRR = lagContributions.reduce((sum, lc) => sum + lc.effect, 0);
  const cumulativeRR = Math.exp(cumulativeLogRR);

  // 4. Confounder adjustments
  const tempConf = temperatureMultiplier(temperature);
  const humConf = humidityMultiplier(humidity);
  const seasonConf = seasonalMultiplier(monthIndex);

  const adjustedRR = cumulativeRR * tempConf.factor * humConf.factor * seasonConf.factor;

  // 5. Attributable Fraction (%)
  const attributableFraction = adjustedRR > 1
    ? Number((((adjustedRR - 1) / adjustedRR) * 100).toFixed(1))
    : 0;

  return {
    unlaggedRR: Number(unlaggedRR.toFixed(3)),
    cumulativeRR: Number(cumulativeRR.toFixed(3)),
    adjustedRR: Number(adjustedRR.toFixed(3)),
    attributableFraction,
    lagContributions,
    confounders: {
      temperatureStress: tempConf.label,
      humidityFactor: humConf.label,
      seasonalBaseline: seasonConf.label,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Ensure we have exactly 6 PM2.5 values for lags 0-5.
 * If fewer are available, apply a 5% daily decay from the last known value
 * to simulate plausible historical levels.
 */
function padPm25History(raw: number[]): number[] {
  if (raw.length >= 6) return raw.slice(0, 6);

  const padded = [...raw];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastKnown = padded[padded.length - 1] || 50; // Fallback to moderate baseline

  while (padded.length < 6) {
    // Decay 5% per missing day — conservative assumption
    padded.push(Number((padded[padded.length - 1] * 0.95).toFixed(2)));
  }

  return padded;
}
