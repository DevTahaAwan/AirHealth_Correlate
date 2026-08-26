"use client";

import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DistrictHistory } from "@/lib/types";

interface CorrelationChartProps {
  districtId: string;
}

export function CorrelationChart({ districtId }: CorrelationChartProps) {
  const [data, setData] = useState<DistrictHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/districts/${districtId}/history`);
        const json = await res.json();
        if (json.success) {
          // Reverse to chronological order for chart (oldest left, newest right)
          json.data.points.reverse();
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (districtId) {
      fetchHistory();
    }
  }, [districtId]);

  if (loading || !data) {
    return <div className="w-full h-full skeleton rounded-md"></div>;
  }

  // Format data for Recharts
  const chartData = data.points.map(pt => {
    // Convert YYYY-MM-DD to standard short format e.g. "Oct 12"
    const d = new Date(pt.date);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    return {
      date: dateStr,
      fullDate: pt.date,
      aqi: pt.aqi,
      symptoms: pt.symptom_report_count,
      precipitation: pt.precipitation_sum || 0
    };
  });

  const isDayOne = chartData.length === 1;

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Live Evidence Banner */}
      {chartData.length < 7 && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center z-10">
          <div className="bg-brand/10 border border-brand/20 text-brand-active px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            Live Evidence Gathering: Day {chartData.length} of 7
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: "#94a3b8" }} 
            tickLine={false} 
            axisLine={false}
            dy={10}
            padding={{ left: isDayOne ? 100 : 20, right: isDayOne ? 100 : 20 }}
          />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 10, fill: "#94a3b8" }} 
          tickLine={false} 
          axisLine={false}
          width={40}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 10, fill: "#7c3aed" }} 
          tickLine={false} 
          axisLine={false}
          width={30}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15,23,42,0.1)'
          }}
          labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
        />
        {/* Precipitation Area (Rain) */}
        <Area 
          yAxisId="right" 
          type="monotone" 
          dataKey="precipitation" 
          name="Rainfall (mm)"
          fill="#3b82f6" 
          stroke="#2563eb" 
          opacity={0.15}
          strokeWidth={1}
        />
        {/* AQI Line (Measured) */}
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="aqi" 
          name="AQI (Measured)"
          stroke="#475569" 
          strokeWidth={2}
          dot={{ r: 3, fill: "#475569" }}
          activeDot={{ r: 5 }}
        />
        {/* Symptom Bar (Community Signal) */}
        <Bar 
          yAxisId="right" 
          dataKey="symptoms" 
          name="Symptom Reports"
          fill="#7c3aed" 
          opacity={0.8}
          radius={[2, 2, 0, 0]} 
          barSize={20}
        />
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  );
}
