export function calculateRespiratoryRisk(pm25: number): number {
  if (pm25 < 0) return 1.0;
  // WHO AirQ+ Math: RR = exp(beta * deltaX)
  const beta = 0.008;
  const safeThreshold = 15;
  const deltaX = Math.max(0, pm25 - safeThreshold);
  return Number(Math.exp(beta * deltaX).toFixed(2));
}
