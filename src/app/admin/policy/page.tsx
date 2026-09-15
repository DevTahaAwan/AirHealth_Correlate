"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { pm25FromAQI } from "@/lib/utils/epa-aqi";
import { PolicyInterventionSimulator } from "@/components/features/policy-intervention-simulator";

interface Metrics {
  cityAqiAverage: number;
}

interface DemographicData {
  totalVulnerable: number;
}

export default function PolicySimulatorPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [metricsRes, demoRes] = await Promise.all([
          fetch("/api/v1/admin/metrics"),
          fetch("/api/v1/admin/demographics")
        ]);

        if (!metricsRes.ok || !demoRes.ok) {
          throw new Error("Unauthorized or server error");
        }

        const metricsJson = await metricsRes.json();
        const demoJson = await demoRes.json();

        if (metricsJson.success) setMetrics(metricsJson.data);
        if (demoJson.success) setDemographics(demoJson.data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
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

  const currentPm25 = metrics?.cityAqiAverage ? pm25FromAQI(metrics.cityAqiAverage) : 55.0;
  const districtPopulation = demographics.reduce((acc, d) => acc + d.totalVulnerable, 0) || 850000;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <SlidersHorizontal className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Policy Interventions & Simulations</h1>
        </header>

        {/* Simulator Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <PolicyInterventionSimulator 
            currentPm25={currentPm25 || 55.0} 
            districtPopulation={districtPopulation}
            districtName="Lahore Citywide"
          />
        </div>

      </div>
    </div>
  );
}
