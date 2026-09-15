import { calculateEPA_AQI } from '@/lib/utils/epa-aqi';

export interface PolicyIntervention {
  id: string;
  name: string;
  description: string;
  pm25ReductionFactor: number; // e.g., 0.15 for 15% reduction
}

export const POLICY_PRESETS: PolicyIntervention[] = [
  {
    id: 'odd-even',
    name: 'Odd-Even Vehicle Rationing',
    description: 'Restricts 50% private passenger cars across central arteries.',
    pm25ReductionFactor: 0.14,
  },
  {
    id: 'brick-kiln',
    name: 'Industrial & Brick Kiln Temporary Shutdown',
    description: 'Enforces Section 144 on non-zigzag kilns and heavy emitters.',
    pm25ReductionFactor: 0.22,
  },
  {
    id: 'heavy-freight',
    name: 'Heavy Transport Ring-Road Curfew',
    description: 'Diverts heavy diesel trucks around outer bypasses during inversions.',
    pm25ReductionFactor: 0.11,
  },
  {
    id: 'combined-emergency',
    name: 'Combined Red-Alert Action Plan',
    description: 'Simultaneous traffic curfew, kiln shutdown, and commercial closures.',
    pm25ReductionFactor: 0.35,
  },
];

export function simulateIntervention(
  currentPm25: number,
  reductionPercent: number,
  districtPopulation: number = 850000
) {
  const beta = 0.008;
  const counterfactual = 15.0; // WHO baseline
  const baseRatePerWeek = 0.0018; // 18 admissions per 10,000 residents per week

  // Baseline calculation
  const deltaBaseline = Math.max(0, currentPm25 - counterfactual);
  const rrBaseline = Math.exp(beta * deltaBaseline);
  const afBaseline = (rrBaseline - 1) / rrBaseline;

  // Simulated scenario
  const simulatedPm25 = Math.max(10, currentPm25 * (1 - reductionPercent / 100));
  const deltaSimulated = Math.max(0, simulatedPm25 - counterfactual);
  const rrSimulated = Math.exp(beta * deltaSimulated);
  const afSimulated = (rrSimulated - 1) / rrSimulated;

  const baselineAqi = calculateEPA_AQI(currentPm25);
  const simulatedAqi = calculateEPA_AQI(simulatedPm25);

  const deltaAf = Math.max(0, afBaseline - afSimulated);
  const weeklyAdmissionsAverted = Math.round(districtPopulation * baseRatePerWeek * deltaAf);

  return {
    baselinePm25: Math.round(currentPm25 * 10) / 10,
    simulatedPm25: Math.round(simulatedPm25 * 10) / 10,
    baselineAqi,
    simulatedAqi,
    baselineAfPercent: Math.round(afBaseline * 1000) / 10,
    simulatedAfPercent: Math.round(afSimulated * 1000) / 10,
    afReductionPercent: Math.round((afBaseline - afSimulated) * 1000) / 10,
    weeklyAdmissionsAverted,
  };
}
