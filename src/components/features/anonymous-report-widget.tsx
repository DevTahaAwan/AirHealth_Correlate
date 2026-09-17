"use client";

import React, { useState, useEffect } from "react";
import { getOrCreateDeviceId } from "@/lib/utils/device-id";
import { CheckCircle2, AlertCircle, Loader2, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistrictListItem } from "@/lib/types";

const SYMPTOMS = [
  { id: "wheezing", label: "Wheezing" },
  { id: "coughing", label: "Coughing" },
  { id: "shortness_of_breath", label: "Shortness of Breath" },
  { id: "chest_tightness", label: "Chest Tightness" },
  { id: "inhaler_used", label: "Inhaler Used" },
  { id: "eye_irritation", label: "Eye Irritation" },
];

export function AnonymousReportForm({ onClose }: { onClose?: () => void }) {
  const [districts, setDistricts] = useState<DistrictListItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number>(5);
  
  const [reporterName, setReporterName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [everUsedInhaler, setEverUsedInhaler] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchDistricts() {
      try {
        const res = await fetch("/api/v1/districts");
        const json = await res.json();
        if (json.success) {
          setDistricts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch districts", err);
      }
    }
    fetchDistricts();
  }, []);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => 
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || selectedSymptoms.length === 0) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const deviceId = getOrCreateDeviceId();
      const payload = {
        district_id: selectedDistrict,
        symptoms: selectedSymptoms,
        severity,
        duration: "unspecified",
        device_id: deviceId,
        name: reporterName || undefined,
        age_group: ageGroup || undefined,
        ever_used_inhaler: everUsedInhaler
      };

      const res = await fetch("/api/v1/symptom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to submit report");
      }

      setStatus("success");
      // Reset form
      setSelectedSymptoms([]);
      setSeverity(5);
      setReporterName("");
      setAgeGroup("");
      setEverUsedInhaler(false);

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Thank You!</h3>
        <p className="text-slate-400 text-sm">
          Your report has been submitted anonymously. Your data helps us track community health impacts.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full max-w-md">
      <h3 className="text-lg font-bold text-slate-100 mb-2">
        Anonymous Health Report
      </h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        Report symptoms anonymously — no account required. Helps us detect health impacts before they reach hospitals.
      </p>

      {status === "error" && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reporter Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Your Name (optional)</label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="e.g. Ali"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* District Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Select your District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            required
          >
            <option value="" disabled>-- Select a district --</option>
            {districts.map((d) => (
              <option key={d.district_id} value={d.district_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Age Group */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Age Group</label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="" disabled>-- Select age group --</option>
            <option value="child">Child</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        {/* Symptoms */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">What are you experiencing?</label>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.id)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border text-left transition-colors",
                    isSelected
                      ? "bg-brand/10 border-brand text-brand-active font-medium"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  )}
                >
                  {symptom.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inhaler Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="inhaler"
            checked={everUsedInhaler}
            onChange={(e) => setEverUsedInhaler(e.target.checked)}
            className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-brand focus:ring-brand focus:ring-offset-slate-900"
          />
          <label htmlFor="inhaler" className="text-sm font-medium text-slate-300 cursor-pointer">
            Have you ever used an inhaler?
          </label>
        </div>

        {/* Severity */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Overall Severity</label>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-md",
              severity >= 7 ? "bg-red-500/20 text-red-400" :
              severity >= 4 ? "bg-amber-500/20 text-amber-400" :
              "bg-emerald-500/20 text-emerald-400"
            )}>
              {severity} / 10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Mild</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedDistrict || selectedSymptoms.length === 0 || isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Report Anonymously"
          )}
        </button>
      </form>
    </div>
  );
}

export function AnonymousReportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-full shadow-2xl font-semibold transition-transform hover:scale-105 active:scale-95 border border-white/10"
      >
        <ClipboardList className="h-5 w-5" />
        Symptom Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-20 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <AnonymousReportForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
