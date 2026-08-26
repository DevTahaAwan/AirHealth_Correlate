import React from "react";
import { Header } from "@/components/layout/header";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Methodology & Data Sources</h1>
        <p className="text-text-secondary mb-12">
          AirHealth Correlate relies on a combination of measured Air Quality Index (AQI) data 
          and community-reported symptom signals to provide real-time respiratory health advisories.
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-border-default">
            1. Safe Exposure Time (Rule 1)
          </h2>
          <div className="bg-bg-secondary p-6 rounded-xl border border-border-default shadow-sm">
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Safe exposure times are calculated using a baseline derived from the <strong>WHO Global Air Quality Guidelines (2021)</strong>. 
              The baseline assumes 120 minutes of safe exposure for a healthy adult at a &quot;Moderate&quot; AQI level (51-100).
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary mb-4">
              <li><strong>Low AQI (0-50):</strong> Multiplier 2.0x</li>
              <li><strong>Moderate AQI (51-100):</strong> Multiplier 1.0x</li>
              <li><strong>High AQI (101-200):</strong> Multiplier 0.5x</li>
              <li><strong>Very High AQI (200+):</strong> Multiplier 0.25x</li>
            </ul>
            <p className="text-sm text-text-secondary leading-relaxed border-t border-border-subtle pt-4">
              <strong>Personalized Penalties:</strong> If a user sets up a Health Profile, multipliers are further reduced 
              (e.g., Asthma/COPD applies a 0.4x penalty).
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-border-default">
            2. Surge Heuristic & Community Signal (Rule 2)
          </h2>
          <div className="bg-surge-subtle p-6 rounded-xl border border-surge/20 shadow-sm">
            <p className="text-sm text-surge-text leading-relaxed mb-4">
              The Surge Advisory is triggered when severe AQI levels (&gt;200) correlate with a spike in 
              <strong> Community Signal</strong> (self-reported respiratory symptoms).
            </p>
            <p className="text-sm text-surge-text leading-relaxed font-medium">
              Reference: <em>Dominici F, et al. Fine particulate air pollution and hospital admission for cardiovascular and respiratory diseases. JAMA. 2006.</em>
            </p>
            <p className="text-sm text-surge-text leading-relaxed mt-4 opacity-90">
              Research indicates a 24-48 hour lag between acute PM2.5 exposure and hospital admissions. 
              By tracking real-time community symptoms during high AQI events, we project the likelihood of localized medical surges.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
