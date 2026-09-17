"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
        <Dialog.Overlay className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content className="pointer-events-auto relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl overflow-hidden bg-slate-900/95 border border-slate-800 shadow-2xl shadow-black data-[state=open]:animate-fade-in focus:outline-none">
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>

            <div className="overflow-y-auto p-6 space-y-4">
              <div className="mb-2 pr-8">
                <Dialog.Title className="text-xl font-bold text-slate-100">
                  Report Symptoms <span className="text-sm font-normal text-slate-400 ml-2">Step {step} of 3</span>
                </Dialog.Title>
              </div>

              <Dialog.Description className="text-sm text-slate-400 mb-6 flex flex-col gap-1">
                <span>
                  Help improve community health signals. Your data is anonymized.
                </span>
                <span className="font-medium text-cyan-400">
                  Reporting for {districtName}
                </span>
              </Dialog.Description>

              <div className="space-y-4">
                {/* Step 1: Symptoms */}
                {step === 1 && (
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                      className="w-full h-2 bg-slate-800/50 border border-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-4 mb-2 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                    />
                    <div className="flex justify-between text-xs text-slate-400 px-1">
                      <span>Mild</span>
                      <span>Severe</span>
                    </div>
                  </div>
                )}

                {/* Step 3: Duration */}
                {step === 3 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">
                      How long have you felt this?
                    </label>
                    <div className="relative mt-2">
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 py-3 pl-4 pr-10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 appearance-none outline-none transition-all"
                      >
                        <option value="just_started" className="bg-slate-900 text-white">Just Started</option>
                        <option value="few_hours" className="bg-slate-900 text-white">Few Hours</option>
                        <option value="all_day" className="bg-slate-900 text-white">All Day</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-400 font-medium p-2 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-2 mt-4">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 mt-6 flex justify-between">
                  <div>
                    {step > 1 && (
                      <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors">
                        Back
                      </button>
                    )}
                    {step === 1 && (
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors">
                          Cancel
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                  <div>
                    {step < 3 ? (
                      <button
                        onClick={handleNext}
                        disabled={step === 1 && selectedSymptoms.length === 0}
                        className="px-4 py-2 text-sm font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-semibold"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center transition-colors shadow-sm font-semibold"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
