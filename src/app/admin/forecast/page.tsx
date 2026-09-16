"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { PredictiveForecast } from "@/components/features/predictive-forecast";
import { PredictiveForecastDay } from "@/lib/types";

interface Metrics {
  predictive_forecast?: PredictiveForecastDay[];
}

export default function ForecastPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/admin/metrics");
        if (!res.ok) throw new Error("Unauthorized or server error");
        const json = await res.json();
        if (json.success) setMetrics(json.data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <ShieldAlert className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-white tracking-tight">72-Hour Predictive Early Warning</h1>
        </header>

        {metrics?.predictive_forecast && metrics.predictive_forecast.length > 0 ? (
          <PredictiveForecast forecasts={metrics.predictive_forecast} />
        ) : (
          <p className="text-slate-500">No forecast data available.</p>
        )}
      </div>
    </div>
  );
}
