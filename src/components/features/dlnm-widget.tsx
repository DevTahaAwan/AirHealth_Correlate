import React from "react";
import { BarChart3 } from "lucide-react";
import { DataBadge } from "@/components/ui/data-badge";
import { DLNMResult } from "@/lib/types";

interface DistributedLagDLNMProps {
  dlnm: DLNMResult;
}

export function DistributedLagDLNM({ dlnm }: DistributedLagDLNMProps) {
  return (
    <section className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          <h3 className="font-bold text-text-primary">
            Distributed Lag & Epidemiological Linkage (DLNM)
          </h3>
        </div>
        <DataBadge
          type="estimated"
          className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20"
        >
          Gasparrini Model
        </DataBadge>
      </div>

      {/* Primary Metric: Attributable Burden */}
      <div className="bg-bg-tertiary border border-border-subtle rounded-xl p-5 text-center">
        <span className="text-5xl font-black text-brand tracking-tighter">
          {dlnm.attributableFraction}%
        </span>
        <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
          Attributable Respiratory Burden — percentage of acute respiratory cases in this
          area directly attributable to cumulative 5-day PM2.5 exposure above the WHO
          15 µg/m³ threshold.
        </p>
      </div>

      {/* Confounder Control Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
          🌡️ {dlnm.confounders.temperatureStress}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
          💧 {dlnm.confounders.humidityFactor}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
          📅 {dlnm.confounders.seasonalBaseline}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          ✅ WHO Baseline Normalized
        </span>
      </div>

      {/* Academic Footnote */}
      <p className="text-[9px] text-text-tertiary italic leading-relaxed border-t border-border-subtle pt-3">
        Modeled using Gasparrini Distributed Lag Non-linear methodology with multi-day
        biological inflammatory decay and meteorological confounder adjustment. Counterfactual
        threshold: WHO PM2.5 annual guideline (15 µg/m³).
      </p>
    </section>
  );
}
