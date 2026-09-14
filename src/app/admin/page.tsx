"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, MapPin, AlertCircle, Loader2 } from "lucide-react";

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
}

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [reportsRes, metricsRes] = await Promise.all([
          fetch("/api/v1/admin/reports"),
          fetch("/api/v1/admin/metrics")
        ]);

        if (!reportsRes.ok || !metricsRes.ok) {
          throw new Error("Unauthorized or server error");
        }

        const reportsJson = await reportsRes.json();
        const metricsJson = await metricsRes.json();

        if (reportsJson.success) setReports(reportsJson.data);
        if (metricsJson.success) setMetrics(metricsJson.data);
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
      <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-none">
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
          <div className="text-xl font-bold text-white leading-tight">
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
      </div>

      {/* Map Container */}
      <div className="flex-1">
        <AdminHeatmap reports={reports} />
      </div>
    </div>
  );
}
