import React from "react";
import { Header } from "@/components/layout/header";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
        <div className="mb-12 border-b border-border-default pb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Methodology & Scientific Basis</h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            AirHealth Correlate bridges the gap between environmental monitoring and real-time public health action. By combining multi-source air quality telemetry with epidemiological math models and crowdsourced symptom validation, we provide actionable, hyper-local health advisories.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-full text-brand font-semibold text-sm">
            <span>Powered by WHO AirQ+ Methodology</span>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Data Sourcing & Telemetry</h2>
          <div className="bg-bg-secondary p-6 rounded-xl border border-border-default shadow-sm prose prose-slate max-w-none">
            <p className="text-text-secondary">
              Our application aggregates real-time environmental data to ensure redundancy and accuracy across Lahore&apos;s micro-environments.
            </p>
            <ul className="list-disc pl-5 space-y-4 text-text-secondary mt-4">
              <li>
                <strong>AQICN (Primary Telemetry):</strong> We utilize live feeds from established, high-fidelity monitoring stations (e.g., the US Consulate station) to establish our baseline PM2.5 and overall AQI metrics.
              </li>
              <li>
                <strong>IQAir AirVisual (Fallback Redundancy):</strong> To guarantee continuous operation, the system automatically fails over to the IQAir REST API if the primary telemetry experiences downtime or returns stale (&gt;24h old) data.
              </li>
              <li>
                <strong>Open-Meteo (Contextual Weather):</strong> Meteorological conditions directly impact particulate dispersion. We integrate live wind speed and precipitation forecasts to provide environmental context alongside the raw AQI.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">The Math: Log-Linear Relative Risk</h2>
          <div className="bg-bg-secondary p-6 rounded-xl border border-border-default shadow-sm">
            <p className="text-text-secondary leading-relaxed mb-6">
              To translate raw PM2.5 concentrations into a tangible health risk multiplier, we implement the core mathematical model utilized by the <strong>World Health Organization&apos;s AirQ+</strong> software.
            </p>
            
            <div className="bg-bg-tertiary p-6 rounded-lg text-center mb-6 font-mono text-lg border border-border-subtle shadow-inner">
              RR = exp(β × ΔX)
            </div>

            <div className="space-y-4 text-sm text-text-secondary">
              <p>Where:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>RR (Relative Risk):</strong> The estimated proportional increase in respiratory hospital admissions.</li>
                <li><strong>β (Beta Coefficient):</strong> Established as <strong>0.008</strong> for short-term PM2.5 exposure relating to respiratory morbidity.</li>
                <li><strong>ΔX (Concentration Delta):</strong> The current PM2.5 concentration minus a baseline safe threshold (15 µg/m³).</li>
              </ul>
              <p className="pt-4 border-t border-border-subtle italic">
                Example: A PM2.5 reading of 85 µg/m³ yields a ΔX of 70. The calculation exp(0.008 × 70) results in a Relative Risk multiplier of ~1.75x (a 75% increased risk of respiratory distress).
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Safe Exposure Time Calculation</h2>
          <div className="bg-bg-secondary p-6 rounded-xl border border-border-default shadow-sm">
            <p className="text-text-secondary leading-relaxed mb-4">
              We dynamically calculate a recommended maximum outdoor exposure time by combining the WHO baseline guidelines with personalized health modifiers.
            </p>
            <ul className="list-disc pl-5 space-y-3 text-sm text-text-secondary mb-6">
              <li><strong>Baseline:</strong> 120 minutes (Healthy Adult at Moderate AQI).</li>
              <li><strong>Age Modifiers:</strong> Children (0.7x) and Seniors (0.6x) receive reduced safe times due to higher respiratory rates and baseline vulnerabilities.</li>
              <li><strong>Exposure Modifiers:</strong> Daily Commuters (0.8x) and Outdoor Workers (0.5x) receive reduced times to account for sustained exertion and traffic micro-environments.</li>
              <li><strong>Pre-existing Conditions:</strong> Severe conditions like Asthma/COPD apply a stringent 0.4x penalty.</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Crowdsourced Verification (Community Signal)</h2>
          <div className="bg-surge-subtle p-6 rounded-xl border border-surge/20 shadow-sm">
            <p className="text-surge-text leading-relaxed mb-4">
              Epidemiological models project risk, but ground-truth verification requires real-world data. We employ a privacy-first crowdsourcing mechanism to detect localized health surges.
            </p>
            <ul className="list-disc pl-5 space-y-3 text-sm text-surge-text opacity-90">
              <li><strong>Device UUID Tracking:</strong> Symptom reports are tied to an anonymous, locally-generated Device UUID. This prevents spam while ensuring k-anonymity for the reporting user.</li>
              <li><strong>Real-Time Aggregation:</strong> When community reports of symptoms (e.g., Wheezing, Shortness of Breath) spike in correlation with severe AQI (&gt;200), the system flags a &quot;Surge Alert&quot; for the district.</li>
              <li><strong>The Lag Effect:</strong> Research (Dominici F, et al.) indicates a 24-48 hour lag between acute PM2.5 exposure and hospital admissions. Our real-time signal aims to provide early warning to healthcare facilities before this lag period expires.</li>
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}
