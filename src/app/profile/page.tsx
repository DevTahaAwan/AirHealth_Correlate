"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { RespiratoryCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { getNearestDistrict } from "@/lib/utils/geolocation";

const CONDITIONS: { id: RespiratoryCondition; label: string; desc: string }[] = [
  { id: "asthma", label: "Asthma", desc: "Chronic inflammatory disease of the airways." },
  { id: "copd", label: "COPD", desc: "Chronic Obstructive Pulmonary Disease." },
  { id: "bronchitis", label: "Bronchitis", desc: "Inflammation of the bronchial tubes." },
  { id: "allergic_rhinitis", label: "Allergic Rhinitis", desc: "Hay fever or seasonal allergies." },
  { id: "none", label: "None", desc: "I do not have any pre-existing respiratory conditions." },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<RespiratoryCondition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const toggleCondition = (condition: RespiratoryCondition) => {
    if (condition === "none") {
      setSelected(["none"]);
      return;
    }
    
    setSelected((prev) => {
      const withoutNone = prev.filter(c => c !== "none");
      if (withoutNone.includes(condition)) {
        return withoutNone.filter(c => c !== condition);
      }
      return [...withoutNone, condition];
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Mock save to localStorage
    setTimeout(() => {
      localStorage.setItem("airhealth_user_conditions", JSON.stringify(selected));
      router.push("/");
    }, 800);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setLocationError(null);
    try {
      const nearest = await getNearestDistrict();
      if (nearest) {
        setLocationName(nearest.name);
      }
    } catch {
      setLocationError("Failed to get location. Please enable location services or select a district manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  // Load existing
  useEffect(() => {
    const saved = localStorage.getItem("airhealth_user_conditions");
    if (saved) {
      try {
        setSelected(JSON.parse(saved));
      } catch {
        // Ignore error
      }
    }
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 md:p-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Health Profile Setup</h1>
        <p className="text-text-secondary mb-8">
          Select any pre-existing respiratory conditions. This helps us calculate a personalized Safe Exposure Time for your area.
        </p>

        <div className="space-y-3 mb-10">
          {CONDITIONS.map((cond) => {
            const isSelected = selected.includes(cond.id);
            return (
              <button
                key={cond.id}
                onClick={() => toggleCondition(cond.id)}
                className={cn(
                  "w-full flex items-start text-left p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-brand bg-brand-subtle"
                    : "border-border-default bg-bg-secondary hover:border-brand/50"
                )}
              >
                <div className="flex-1">
                  <h3 className={cn("font-semibold text-lg", isSelected ? "text-brand-active" : "text-text-primary")}>
                    {cond.label}
                  </h3>
                  <p className={cn("text-sm mt-1", isSelected ? "text-brand-active/80" : "text-text-secondary")}>
                    {cond.desc}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-6 w-6 text-brand mt-1 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Optional Location Detection */}
        <div className="mb-10 bg-bg-secondary border border-border-default rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-text-primary">Set Your Default District</h3>
            <p className="text-sm text-text-secondary mt-1">
              Enable location access so we can automatically show you relevant AQI data for your area.
            </p>
            {locationName && (
              <p className="text-sm font-medium text-community mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Location Set: {locationName}
              </p>
            )}
            {locationError && (
              <p className="text-sm font-medium text-error mt-2">
                {locationError}
              </p>
            )}
          </div>
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting || !!locationName}
            className="shrink-0 px-5 py-2.5 bg-bg-tertiary text-text-primary hover:bg-border-default border border-border-default font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {locationName ? "Location Detected" : "Detect My Location"}
          </button>
        </div>

        <div className="flex justify-end border-t border-border-default pt-6">
          <button
            onClick={handleSave}
            disabled={selected.length === 0 || isSaving}
            className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Continue
          </button>
        </div>
      </main>
    </div>
  );
}
