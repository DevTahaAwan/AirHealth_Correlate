import React from "react";
import { ShieldAlert, Activity } from "lucide-react";
import { DataBadge } from "@/components/ui/data-badge";
import { PredictiveForecastDay } from "@/lib/types";
import { getAQICategory } from "@/lib/utils/epa-aqi";

interface PredictiveForecastProps {
  forecasts: PredictiveForecastDay[];
}

export function PredictiveForecast({ forecasts }: PredictiveForecastProps) {
  if (!forecasts || forecasts.length === 0) {
    return null;
  }

  return (
    <section className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold text-text-primary">
            72-Hour Predictive Early Warning
          </h3>
        </div>
        <DataBadge
          type="estimated"
          className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20"
        >
          AI Forecast
        </DataBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {forecasts.map((forecast, idx) => {
          const dayLabel = idx === 0 ? "Tomorrow" : idx === 1 ? "Day 2" : "Day 3";
          const aqiColor = getAQICategory(forecast.aqi).color;
          
          return (
            <div key={idx} className="bg-bg-tertiary border border-border-subtle rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
              {/* Decorative Top Border */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: aqiColor }} />
              
              <div className="flex justify-between items-start mt-1">
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{dayLabel}</p>
                  <p className="text-[10px] text-text-tertiary">{new Date(forecast.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</p>
                </div>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${aqiColor}20`, color: aqiColor }}
                >
                  AQI {forecast.aqi}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-text-primary tracking-tight">{forecast.pm25}</span>
                <span className="text-xs text-text-tertiary">µg/m³</span>
              </div>

              {forecast.surgePercentage > 0 ? (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                  <Activity className="h-3 w-3" />
                  Projected Surge: +{forecast.surgePercentage}%
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                  <Activity className="h-3 w-3" />
                  No Surge Expected
                </div>
              )}

              <p className="text-[11px] text-text-secondary leading-relaxed mt-2 border-t border-border-subtle pt-2">
                {forecast.weatherSummary}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
