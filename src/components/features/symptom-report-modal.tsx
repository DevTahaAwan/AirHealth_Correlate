"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { SymptomType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SYMPTOMS: { id: SymptomType; label: string }[] = [
  { id: "coughing", label: "Coughing" },
  { id: "wheezing", label: "Wheezing" },
  { id: "shortness_of_breath", label: "Shortness of Breath" },
  { id: "chest_tightness", label: "Chest Tightness" },
  { id: "inhaler_used", label: "Used Rescue Inhaler" },
  { id: "eye_irritation", label: "Eye Irritation" },
];

interface SymptomReportModalProps {
  districtId: string;
  districtName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SymptomReportModal({
  districtId,
  districtName,
  isOpen,
  onClose,
  onSuccess,
}: SymptomReportModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState<number>(5);
  const [duration, setDuration] = useState<string>("few_hours");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const toggleSymptom = (symptom: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
    setError(null);
  };

  const handleNext = () => {
    if (step === 1 && selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }
    setError(null);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/symptom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_id: districtId,
          symptoms: selectedSymptoms,
          severity,
          duration,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to submit report");
      }

      router.refresh();
      onSuccess();
      setTimeout(() => {
        onClose();
        setSelectedSymptoms([]);
        setStep(1);
      }, 1500); // Allow time to see success state
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setStep(1); // Reset on close
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        
        {/* The Screen Lock & Centering Wrapper */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          
          {/* The Modal Container */}
          <Dialog.Content className="pointer-events-auto relative w-full max-w-md max-h-[90vh] flex flex-col bg-slate-900/95 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden data-[state=open]:animate-fade-in focus:outline-none">
            
            {/* STICKY HEADER */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 shrink-0">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-100">Report Symptoms</Dialog.Title>
                <Dialog.Description className="text-sm text-slate-400 mt-1">Help us track local health impacts.</Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="text-sm font-medium text-cyan-400 mb-2">
                Reporting for {districtName} - Step {step} of 3
              </div>

              {/* Step 1: Symptoms */}
              {step === 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-100">
                    What are you experiencing?
                  </label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {SYMPTOMS.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom.id);
                      return (
                        <button
                          key={symptom.id}
                          type="button"
                          onClick={() => toggleSymptom(symptom.id)}
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                          )}
                        >
                          <span className="text-sm font-medium">{symptom.label}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Severity */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-100">
                      Symptom Severity (1-10)
                    </label>
                    <span className="text-sm font-bold text-cyan-400">{severity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 border border-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-4 mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-400 px-1">
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>
              )}

              {/* Step 3: Duration */}
              {step === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-100">
                    How long have you felt this?
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 py-3 pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    >
                      <option value="just_started" className="bg-slate-900 text-slate-100">Just Started</option>
                      <option value="few_hours" className="bg-slate-900 text-slate-100">Few Hours</option>
                      <option value="all_day" className="bg-slate-900 text-slate-100">All Day</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none">
                      <ChevronDown size={20} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-400 font-medium p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* STICKY FOOTER */}
            <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0 space-y-4">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 && selectedSymptoms.length === 0}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Report"}
                </button>
              )}

              <div className="flex justify-center">
                {step > 1 ? (
                  <button type="button" onClick={handleBack} className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
                    Back
                  </button>
                ) : (
                  <Dialog.Close asChild>
                    <button type="button" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                )}
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

