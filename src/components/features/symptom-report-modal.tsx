"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getDeviceId } from "@/lib/utils/device-id";
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
  const router = useRouter();

  const toggleSymptom = (symptom: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
    setError(null);
  };

  const handleSubmit = async () => {
    const deviceId = getDeviceId();
    if (!deviceId) {
      setError("Unable to identify device. Please enable localStorage.");
      return;
    }
    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/symptom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: deviceId,
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
      }, 1500); // Allow time to see success state
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-bg-secondary rounded-xl shadow-elevated p-6 data-[state=open]:animate-fade-in focus:outline-none">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-xl font-bold text-text-primary">
              Report Symptoms
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-secondary hover:bg-bg-tertiary p-1.5 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-text-secondary mb-6 flex flex-col gap-1">
            <span>
              Help improve community health signals. Your data is anonymized.
            </span>
            <span className="font-medium text-community">
              Reporting for {districtName}
            </span>
          </Dialog.Description>

          <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
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
                            ? "border-community bg-community-subtle text-community-text"
                            : "border-border-default hover:border-text-placeholder bg-bg-secondary text-text-primary"
                        )}
                      >
                        <span className="text-sm font-medium">{symptom.label}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-community" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Slider */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-text-primary">
                    Symptom Severity (1-10)
                  </label>
                  <span className="text-sm font-bold text-community">{severity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-2 bg-border-default rounded-lg appearance-none cursor-pointer accent-community"
                />
                <div className="flex justify-between text-xs text-text-secondary px-1">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-sm font-medium text-text-primary">
                  How long have you felt this?
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: "just_started", label: "Just Started" },
                    { id: "few_hours", label: "Few Hours" },
                    { id: "all_day", label: "All Day" },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setDuration(dur.id)}
                      className={cn(
                        "py-2 px-1 text-xs font-medium rounded-md border transition-colors text-center",
                        duration === dur.id
                          ? "border-brand bg-brand-subtle text-brand-active"
                          : "border-border-default hover:border-text-placeholder bg-bg-secondary text-text-primary"
                      )}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm text-error font-medium p-2 bg-error-subtle rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-4 border-t border-border-subtle mt-6 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary rounded-md">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedSymptoms.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-community hover:bg-community-text rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[100px] justify-center transition-colors shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
                </button>
              </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
