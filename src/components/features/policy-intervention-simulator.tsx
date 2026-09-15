"use client";

import React, { useState, useMemo } from "react";
import { SlidersHorizontal, TrendingDown, Car, Factory, ShieldAlert, Users } from "lucide-react";
import { POLICY_PRESETS, simulateIntervention } from "@/lib/services/policy-simulator";
import { getAQICategory } from "@/lib/utils/epa-aqi";
import { cn } from "@/lib/utils";

import { PolicyBriefExport } from "./policy-brief-export";

interface PolicyInterventionSimulatorProps {
  currentPm25: number;
  districtPopulation?: number;
  districtName?: string;
}

export function PolicyInterventionSimulator({ 
  currentPm25, 
  districtPopulation = 850000,
  districtName = "Citywide"
}: PolicyInterventionSimulatorProps) {
  const [reductionPercent, setReductionPercent] = useState<number>(0);
  const [population, setPopulation] = useState<number>(districtPopulation);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const simulation = useMemo(() => {
    return simulateIntervention(currentPm25, reductionPercent, population);
  }, [currentPm25, reductionPercent, population]);

  const handlePresetClick = (presetId: string, percent: number) => {
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
      setReductionPercent(0);
    } else {
      setSelectedPresetId(presetId);
      setReductionPercent(percent * 100);
    }
  };

  const baselineAqiCat = simulation.baselineAqi !== null ? getAQICategory(simulation.baselineAqi) : null;
  const simulatedAqiCat = simulation.simulatedAqi !== null ? getAQICategory(simulation.simulatedAqi) : null;
  
  const selectedPresetName = selectedPresetId 
    ? POLICY_PRESETS.find(p => p.id === selectedPresetId)?.name || ""
    : "Custom PM2.5 Reduction";

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand" />
          <h2 className="font-bold text-lg text-text-primary">Policy Scenario Simulation</h2>
        </div>
        <PolicyBriefExport 
          districtName={districtName}
          currentAqi={simulation.baselineAqi}
          currentPm25={simulation.baselinePm25}
          baselineAfPercent={simulation.baselineAfPercent}
          simulatedAfPercent={simulation.simulatedAfPercent}
          interventionName={selectedPresetName}
          simulatedPm25={simulation.simulatedPm25}
          admissionsAverted={simulation.weeklyAdmissionsAverted}
        />
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Intervention Presets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POLICY_PRESETS.map((preset) => {
              const Icon = preset.id.includes('odd-even') ? Car : 
                           preset.id.includes('kiln') ? Factory : ShieldAlert;
              const isSelected = selectedPresetId === preset.id;
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id, preset.pm25ReductionFactor)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-3 rounded-lg border text-left transition-all",
                    isSelected 
                      ? "bg-brand/20 border-brand/50 text-brand" 
                      : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold text-sm leading-tight">{preset.name}</span>
                  </div>
                  <span className="text-[10px] opacity-80 line-clamp-2">
                    {preset.description}
                  </span>
                  <span className="text-xs font-bold mt-1 bg-black/20 px-2 py-0.5 rounded-full">
                    -{(preset.pm25ReductionFactor * 100).toFixed(0)}% PM2.5
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5 bg-slate-800/30 p-4 rounded-lg border border-slate-800/50">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-text-secondary">Custom PM2.5 Reduction</label>
              <span className="text-lg font-bold text-emerald-400">{reductionPercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={reductionPercent}
              onChange={(e) => {
                setReductionPercent(parseFloat(e.target.value));
                setSelectedPresetId(null);
              }}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50% Max</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> District Population
              </label>
            </div>
            <input
              type="number"
              min="10000"
              value={population}
              onChange={(e) => setPopulation(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* Outputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline vs Simulated AQI */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Baseline Conditions</h4>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-400">{simulation.baselineAqi}</div>
                <div className="text-sm text-slate-500 font-medium">AQI</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-400">{simulation.baselinePm25}</div>
                <div className="text-xs text-slate-500">µg/m³ PM2.5</div>
              </div>
            </div>
            {baselineAqiCat && (
              <div className="mt-3 text-xs font-semibold px-2 py-1 rounded w-fit" style={{ backgroundColor: `${baselineAqiCat.color}20`, color: baselineAqiCat.color }}>
                {baselineAqiCat.label}
              </div>
            )}
          </div>
          
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col justify-between relative overflow-hidden">
            {/* Highlight simulated background based on color */}
            {simulatedAqiCat && (
              <div className="absolute inset-0 opacity-5" style={{ backgroundColor: simulatedAqiCat.color }} />
            )}
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 relative z-10">Simulated Outcome</h4>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-3xl font-black text-cyan-400">{simulation.simulatedAqi}</div>
                <div className="text-sm text-cyan-500/70 font-medium">AQI</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400">{simulation.simulatedPm25}</div>
                <div className="text-xs text-cyan-500/70">µg/m³ PM2.5</div>
              </div>
            </div>
            {simulatedAqiCat && (
              <div className="mt-3 text-xs font-semibold px-2 py-1 rounded w-fit relative z-10" style={{ backgroundColor: `${simulatedAqiCat.color}30`, color: simulatedAqiCat.color }}>
                {simulatedAqiCat.label}
              </div>
            )}
          </div>
        </div>

        {/* Attributable Burden & Admissions */}
        <div className="md:col-span-1 bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col justify-center items-center text-center space-y-4">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attributable Burden (AF)</h4>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <span className="text-slate-400">{simulation.baselineAfPercent}%</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400">{simulation.simulatedAfPercent}%</span>
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-700/50" />
          
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-500">
              <TrendingDown className="h-4 w-4" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider">Weekly Admissions Averted</h4>
            </div>
            <div className="text-4xl md:text-5xl font-black text-emerald-500 tracking-tighter">
              {simulation.weeklyAdmissionsAverted}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 max-w-[180px] mx-auto leading-tight">
              Estimated emergency respiratory visits prevented over 7 days in this district.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
