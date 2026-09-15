"use client";

import React, { useRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

interface PolicyBriefExportProps {
  districtName: string;
  currentAqi: number | null;
  currentPm25: number | null;
  baselineAfPercent: number;
  simulatedAfPercent: number;
  interventionName: string;
  simulatedPm25: number;
  admissionsAverted: number;
  className?: string;
}

export function PolicyBriefExport({
  districtName,
  currentAqi,
  currentPm25,
  baselineAfPercent,
  simulatedAfPercent,
  interventionName,
  simulatedPm25,
  admissionsAverted,
  className,
}: PolicyBriefExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);

    try {
      const element = pdfRef.current;
      // Make it visible momentarily to ensure correct rendering if needed, 
      // though html2canvas often renders absolute hidden elements fine.
      element.style.display = "block";

      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const dateStr = new Date().toISOString().split("T")[0];
      const safeDistrict = districtName.replace(/\s+/g, '_');
      
      pdf.save(`AirHealth_Brief_${safeDistrict}_${dateStr}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const currentDateStr = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const pm25Drop = currentPm25 ? Math.max(0, currentPm25 - simulatedPm25).toFixed(1) : "0.0";

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-slate-900",
          className
        )}
      >
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Export Cabinet Evidence Brief (PDF)
      </button>

      {/* Off-screen PDF Container */}
      <div 
        className="fixed top-[200vh] left-[200vw]"
        aria-hidden="true"
      >
        <div 
          ref={pdfRef} 
          className="bg-white text-black p-8 w-[800px] h-[1131px]"
          style={{ display: "none" }}
        >
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="font-serif text-3xl font-bold mb-2">Government of Punjab — Smog Mitigation & Epidemiological Brief</h1>
            <p className="text-sm text-slate-600">Generated on {currentDateStr}</p>
          </div>

          <div className="space-y-8">
            {/* District Context */}
            <section>
              <h2 className="font-bold text-lg mb-3 uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">Current Telemetry: {districtName}</h2>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 font-semibold">Recorded AQI</th>
                    <td className="py-2 text-right">{currentAqi ?? "N/A"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 font-semibold">PM2.5 Concentration</th>
                    <td className="py-2 text-right">{currentPm25 ?? "N/A"} µg/m³</td>
                  </tr>
                  <tr>
                    <th className="py-2 font-semibold">Attributable Health Fraction (AF)</th>
                    <td className="py-2 text-right text-red-700 font-bold">{baselineAfPercent}%</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Simulated Outcome */}
            <section>
              <h2 className="font-bold text-lg mb-3 uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">Simulated Policy Outcome</h2>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-4">
                <span className="font-bold text-slate-700">Selected Intervention: </span>
                <span>{interventionName || "Custom PM2.5 Reduction"}</span>
              </div>
              
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 font-semibold">Projected PM2.5 Drop</th>
                    <td className="py-2 text-right font-bold text-emerald-700">-{pm25Drop} µg/m³</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 font-semibold">New Attributable Fraction (AF)</th>
                    <td className="py-2 text-right text-emerald-700 font-bold">{simulatedAfPercent}%</td>
                  </tr>
                  <tr>
                    <th className="py-2 font-semibold text-xl pt-4">Calculated Respiratory ER Burden Reduction</th>
                    <td className="py-2 text-right pt-4">
                      <span className="text-2xl font-black text-emerald-700">{admissionsAverted}</span>
                      <span className="block text-xs text-slate-500">weekly admissions averted</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          {/* Footer / Methodology */}
          <div className="mt-16 pt-4 border-t border-slate-300">
            <p className="text-xs text-slate-500 font-serif italic">
              * Modeled using WHO AirQ+ dose-response relative risk equations and US EPA piecewise linear break tables.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
