import { calculateEPA_AQI } from "@/lib/utils/epa-aqi";
import { calculateRespiratoryRisk } from "@/lib/utils/airq-calculator";
import { PredictiveForecastDay } from "@/lib/types";

export interface WeatherForecastInput {
  date: string;
  minTemp: number; // min temperature in °C
  maxTemp: number; // max temperature in °C
  windSpeed: number; // max wind speed in km/h
  precipitation: number; // precipitation sum in mm
}

export function generate72HourForecast(
  currentPm25: number,
  weatherForecasts: WeatherForecastInput[]
): PredictiveForecastDay[] {
  const forecasts: PredictiveForecastDay[] = [];
  let basePm25 = currentPm25;

  for (let i = 0; i < Math.min(3, weatherForecasts.length); i++) {
    const weather = weatherForecasts[i];
    let dailyPm25 = basePm25;
    const triggers: string[] = [];
    
    // 1. Rain Washout Factor
    if (weather.precipitation > 5) {
      dailyPm25 *= 0.6;
      triggers.push("rain washout");
    }

    // 2. Stagnation Penalty
    if (weather.windSpeed < 5) {
      dailyPm25 *= 1.25;
      triggers.push("wind stagnation");
    }

    // 3. Ventilation Bonus
    if (weather.windSpeed > 15) {
      dailyPm25 *= 0.85;
      triggers.push("wind dispersion");
    }

    // 4. Thermal Inversion (Cold)
    if (weather.minTemp < 12) {
      dailyPm25 *= 1.15;
      triggers.push("thermal inversion (<12°C)");
    }

    // Carry over to next day
    basePm25 = dailyPm25;

    // Calculate derived metrics
    const forecastAqi = calculateEPA_AQI(dailyPm25);
    const rr = calculateRespiratoryRisk(dailyPm25);
    // Surge Percentage: (RR - 1) * 100
    const surgePercentage = Math.round((rr - 1) * 100);

    // Dynamic Advisory
    let weatherSummary = "Stable weather conditions expected.";
    if (triggers.length > 0) {
      const isWorsening = triggers.includes("wind stagnation") || triggers.includes("thermal inversion (<12°C)");
      if (isWorsening) {
         weatherSummary = `Forecasted ${triggers.join(" and ")} will trap pollutants. Vulnerable citizens should secure inhalers and limit outdoor time.`;
      } else {
         weatherSummary = `Forecasted ${triggers.join(" and ")} will help clear smog. Air quality is expected to improve.`;
      }
    }

    forecasts.push({
      day: i + 1,
      date: weather.date,
      pm25: Math.round(dailyPm25 * 10) / 10,
      aqi: forecastAqi ?? 0,
      surgePercentage,
      weatherSummary,
      triggers,
    });
  }

  return forecasts;
}
