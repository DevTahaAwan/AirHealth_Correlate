"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, MapPin, AlertCircle, Loader2, Users } from "lucide-react";
import { DistributedLagDLNM } from "@/components/features/dlnm-widget";
import { PredictiveForecast } from "@/components/features/predictive-forecast";
import { PolicyInterventionSimulator } from "@/components/features/policy-intervention-simulator";
import { pm25FromAQI } from "@/lib/utils/epa-aqi";
import { DLNMResult, PredictiveForecastDay } from "@/lib/types";
// Dynamically import the Leaflet heatmap to avoid SSR issues
const AdminHeatmap = dynamic(
  () => import("@/components/features/admin-heatmap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

interface Metrics {
  totalReportsToday: number;
  mostAffectedDistrict: string;
  mostAffectedCount: number;
  cityAqiAverage: number;
  dlnm?: DLNMResult;
  predictive_forecast?: PredictiveForecastDay[];
}

interface DemographicData {
  district: string;
  conditions: Record<string, number>;
  totalVulnerable: number;
}

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [reportsRes, metricsRes, demoRes] = await Promise.all([
          fetch("/api/v1/admin/reports"),
          fetch("/api/v1/admin/metrics"),
          fetch("/api/v1/admin/demographics")
        ]);

        if (!reportsRes.ok || !metricsRes.ok || !demoRes.ok) {
          throw new Error("Unauthorized or server error");
        }

        const reportsJson = await reportsRes.json();
        const metricsJson = await metricsRes.json();
        const demoJson = await demoRes.json();

        if (reportsJson.success) setReports(reportsJson.data);
        if (metricsJson.success) setMetrics(metricsJson.data);
        if (demoJson.success) setDemographics(demoJson.data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load admin data");
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
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div className="h-full flex flex-col relative">
      {/* Top Overlay Metrics */}
      <div className="absolute top-4 left-4 right-[400px] z-10 grid grid-cols-1 md:grid-cols-4 gap-4 pointer-events-none">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Reports Today</span>
          </div>
          <div className="text-3xl font-black text-white">
            {metrics?.totalReportsToday || 0}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <MapPin className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Most Affected Area</span>
          </div>
          <div className="text-xl font-bold text-white leading-tight truncate">
            {metrics?.mostAffectedDistrict || "N/A"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics?.mostAffectedCount || 0} reports
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider">City AQI Average</span>
          </div>
          <div className="text-3xl font-black text-white">
            {metrics?.cityAqiAverage || 0}
          </div>
        </div>
        
        {/* Metric 4: Vulnerable Population */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl pointer-events-auto max-h-[250px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Vulnerable Population</span>
          </div>
          
          <div className="space-y-3 mt-3">
            {demographics.length === 0 ? (
              <p className="text-sm text-slate-500">No demographic data found.</p>
            ) : (
              demographics.slice(0, 3).map((demo) => (
                <div key={demo.district} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white truncate pr-2">{demo.district}</span>
                    <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                      {demo.totalVulnerable} total
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    {Object.entries(demo.conditions).map(([cond, count]) => (
                      <div key={cond} className="flex justify-between">
                        <span className="capitalize text-slate-500">{cond}</span>
                        <span className="text-slate-300">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>



      {/* Map Container */}
      <div className="flex-1 relative">
        <AdminHeatmap reports={reports} />
        
        {/* Right Side Tools Panel */}
        <div className="absolute top-0 right-0 bottom-0 w-[380px] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-10 overflow-y-auto p-4 space-y-6">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-lg font-bold text-white">Command Center Analytics</h2>
            <p className="text-xs text-slate-400">Predictive & Epidemiological Tools</p>
          </div>
          
          {metrics?.predictive_forecast && (
            <PredictiveForecast forecasts={metrics.predictive_forecast} />
          )}
          
          {metrics?.dlnm && (
            <DistributedLagDLNM dlnm={metrics.dlnm} />
          )}
          
          <div className="bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
            <PolicyInterventionSimulator 
              currentPm25={(metrics?.cityAqiAverage ? pm25FromAQI(metrics.cityAqiAverage) : null) ?? 55.0} 
              districtPopulation={demographics.reduce((acc, d) => acc + d.totalVulnerable, 0) || 850000}
              districtName="Lahore Citywide"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
