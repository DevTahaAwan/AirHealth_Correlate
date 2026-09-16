"use client";

import React, { useState, useEffect } from "react";

import { Header } from "@/components/layout/header";
import { RespiratoryCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { getNearestDistrict } from "@/lib/utils/geolocation";
import { useAuth } from "@/components/auth/auth-provider";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { useToast } from "@/lib/hooks/use-toast";

const CONDITIONS: { id: RespiratoryCondition; label: string; desc: string }[] = [
  { id: "asthma", label: "Asthma", desc: "Chronic inflammatory disease of the airways." },
  { id: "copd", label: "COPD", desc: "Chronic Obstructive Pulmonary Disease." },
  { id: "bronchitis", label: "Bronchitis", desc: "Inflammation of the bronchial tubes." },
  { id: "allergic_rhinitis", label: "Allergic Rhinitis", desc: "Hay fever or seasonal allergies." },
  { id: "none", label: "None", desc: "I do not have any pre-existing respiratory conditions." },
];

export default function OnboardingPage() {

  const { user, supabase } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [selected, setSelected] = useState<RespiratoryCondition[]>([]);
  const [ageGroup, setAgeGroup] = useState<string>("adult");
  const [exposure, setExposure] = useState<string>("mostly_indoors");
  const [rescueInhaler, setRescueInhaler] = useState<string>("never");
  const [baselineSpo2, setBaselineSpo2] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [locationName, setLocationName] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize from existing profile or local storage migration
  useEffect(() => {
    if (profileLoading) return;

    if (profile) {
      setFullName(profile.full_name || "");
      setSelected(profile.conditions || []);
      setAgeGroup(profile.age_group || "adult");
      setExposure(profile.exposure_level || "mostly_indoors");
      // Use any to bypass TS error if type is missing, since we know it's in DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = profile as any;
      setRescueInhaler(p.rescue_inhaler_usage || "never");
      if (p.baseline_spo2) setBaselineSpo2(p.baseline_spo2.toString());
      setDistrictId(profile.home_district_id);
    } else {
      // Try to migrate from local storage
      const savedConditions = localStorage.getItem("airhealth_user_conditions");
      if (savedConditions) {
        try {
          setSelected(JSON.parse(savedConditions));
        } catch {
          // Ignore
        }
      }
      const savedAge = localStorage.getItem("airhealth_user_age");
      if (savedAge) setAgeGroup(savedAge);
      const savedExposure = localStorage.getItem("airhealth_user_exposure");
      if (savedExposure) setExposure(savedExposure);
    }
  }, [profile, profileLoading]);

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

  const handleSave = async () => {
    if (!user) return;
    
    // SpO2 Validation: Must be between 70 and 100
    const spo2Num = baselineSpo2 ? parseInt(baselineSpo2, 10) : null;
    if (spo2Num !== null && (isNaN(spo2Num) || spo2Num < 70 || spo2Num > 100)) {
      showToast({
        title: "Invalid SpO2",
        message: "Please enter a valid baseline SpO₂ between 70% and 100%.",
        variant: "error"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        auth_id: user.id,
        full_name: fullName,
        age_group: ageGroup,
        conditions: selected,
        exposure_level: exposure,
        rescue_inhaler_usage: rescueInhaler,
        baseline_spo2: baselineSpo2 ? parseInt(baselineSpo2, 10) : null,
        home_district_id: districtId,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "auth_id" });

      if (error) throw error;

      // Clean up localStorage migration data
      localStorage.removeItem("airhealth_user_conditions");
      localStorage.removeItem("airhealth_user_age");
      localStorage.removeItem("airhealth_user_exposure");

      // Hard redirect to clear Next.js router cache
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setLocationError(null);
    try {
      const nearest = await getNearestDistrict();
      if (nearest) {
        setLocationName(nearest.name);
        setDistrictId(nearest.district_id);
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        showToast({
          title: "Location access denied",
          message: "Please enable it in your browser settings.",
          variant: "error"
        });
      }
      setLocationError("Failed to get location. Please enable location services or select a district manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 md:p-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Health Profile Setup</h1>
        <p className="text-text-secondary mb-8">
          Complete your profile to receive personalized Safe Exposure Time calculations for your area.
        </p>

        <div className="mb-10">
          <label className="block text-sm font-bold text-text-primary mb-3">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border-default bg-bg-secondary focus:border-brand focus:ring-0 transition-colors text-text-primary"
            placeholder="Jane Doe"
          />
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-text-primary mb-3">Pre-existing Conditions</h2>
          <div className="space-y-3">
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
        </div>

        {/* Age Group */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-text-primary mb-3">Age Group</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "child", label: "Child (Under 12)" },
              { id: "adult", label: "Adult" },
              { id: "senior", label: "Senior (65+)" }
            ].map(age => (
              <button
                key={age.id}
                onClick={() => setAgeGroup(age.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  ageGroup === age.id
                    ? "border-brand bg-brand-subtle text-brand-active font-semibold"
                    : "border-border-default bg-bg-secondary hover:border-brand/50 text-text-primary"
                )}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outdoor Exposure */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-text-primary mb-3">Outdoor Exposure Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "mostly_indoors", label: "Mostly Indoors" },
              { id: "commuter", label: "Daily Commuter" },
              { id: "outdoor_worker", label: "Outdoor Worker" }
            ].map(exp => (
              <button
                key={exp.id}
                onClick={() => setExposure(exp.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  exposure === exp.id
                    ? "border-brand bg-brand-subtle text-brand-active font-semibold"
                    : "border-border-default bg-bg-secondary hover:border-brand/50 text-text-primary"
                )}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Medical Baselines */}
        <div className="mb-10 p-6 bg-bg-secondary border border-border-default rounded-xl">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            Clinical Baselines (Optional)
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Rescue Inhaler Usage</label>
              <select
                value={rescueInhaler}
                onChange={(e) => setRescueInhaler(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary focus:border-brand outline-none"
              >
                <option value="never">Never</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="multiple_daily">Multiple times a day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Baseline SpO₂ %</label>
              <input
                type="number"
                min="70"
                max="100"
                value={baselineSpo2}
                onChange={(e) => setBaselineSpo2(e.target.value)}
                placeholder="e.g., 98"
                className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary focus:border-brand outline-none"
              />
            </div>
          </div>
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

        <div className="flex justify-end border-t border-border-default pt-6 pb-12">
          <button
            onClick={handleSave}
            disabled={selected.length === 0 || isSaving}
            className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </button>
        </div>
      </main>
    </div>
  );
}
