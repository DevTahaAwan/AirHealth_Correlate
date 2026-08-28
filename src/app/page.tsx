"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MapWrapper } from "@/components/features/map-wrapper";
import { SurgeAdvisoryBanner } from "@/components/ui/surge-advisory-banner";
import { DistrictDetailDrawer } from "@/components/features/district-detail-drawer";
import { SymptomReportModal } from "@/components/features/symptom-report-modal";
import { DistrictListItem, SurgeFlagItem, DistrictDetail, SafeTimeResult } from "@/lib/types";
import { getNearestDistrict } from "@/lib/utils/geolocation";
import { MapPin } from "lucide-react";

export default function DashboardPage() {
  const [districts, setDistricts] = useState<DistrictListItem[]>([]);
  const [surgeFlags, setSurgeFlags] = useState<SurgeFlagItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  
  const [districtDetail, setDistrictDetail] = useState<DistrictDetail | null>(null);
  const [safeTime, setSafeTime] = useState<SafeTimeResult | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // const { isSignedIn } = useAuth(); // unused

  // Initial Data Fetch (Districts & Surge Flags)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [distRes, surgeRes] = await Promise.all([
          fetch("/api/v1/districts"),
          fetch("/api/v1/surge-flags")
        ]);
        
        const distJson = await distRes.json();
        const surgeJson = await surgeRes.json();
        
        if (distJson.success) setDistricts(distJson.data);
        if (surgeJson.success) setSurgeFlags(surgeJson.data);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    }
    fetchInitialData();
  }, []);

  // Auto-detect location on mount if permitted, or prompt
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    try {
      const nearest = await getNearestDistrict();
      if (nearest) {
        setSelectedDistrictId(nearest.district_id);
      }
    } catch {
      // Silently fail if location access is denied or errors out
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Fetch District Detail & Safe Time when selected
  useEffect(() => {
    if (!selectedDistrictId) {
      setDistrictDetail(null);
      setSafeTime(null);
      return;
    }

    async function fetchDetail() {
      setIsDrawerLoading(true);
      try {
        // Get user profile modifiers
        const conditionsStr = localStorage.getItem("airhealth_user_conditions");
        const ageGroup = localStorage.getItem("airhealth_user_age") || "adult";
        const exposure = localStorage.getItem("airhealth_user_exposure") || "mostly_indoors";
        
        let safeTimeUrl = `/api/v1/safe-time?district_id=${selectedDistrictId}&ageGroup=${ageGroup}&exposure=${exposure}`;
        if (conditionsStr) {
          try {
            const conditions = JSON.parse(conditionsStr);
            if (conditions.length > 0) {
              safeTimeUrl += `&conditions=${conditions.join(",")}`;
            }
          } catch {
            // Ignore parse errors
          }
        }

        const [detailRes, safeRes] = await Promise.all([
          fetch(`/api/v1/districts/${selectedDistrictId}`),
          fetch(safeTimeUrl)
        ]);

        const detailJson = await detailRes.json();
        const safeJson = await safeRes.json();

        if (detailJson.success) {
          const listMatch = districts.find(d => d.district_id === selectedDistrictId);
          const merged = { ...detailJson.data };
          if (listMatch) {
            merged.aqi = listMatch.aqi;
            merged.pm25 = listMatch.pm25;
            merged.risk_tier = listMatch.risk_tier;
            merged.has_aqi_data = listMatch.has_aqi_data;
          }
          setDistrictDetail(merged);
        }
        if (safeJson.success) setSafeTime(safeJson.data);
      } catch (err) {
        console.error("Failed to fetch district detail", err);
      } finally {
        setIsDrawerLoading(false);
      }
    }

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictId]);

  const handleDistrictSelect = (id: string) => {
    setSelectedDistrictId(id);
  };

  const closeDrawer = () => {
    setSelectedDistrictId(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar onDistrictSelect={handleDistrictSelect} selectedDistrictId={selectedDistrictId} />
        
        <main className="flex-1 relative flex flex-col z-0">
          {/* Absolute Surge Banner Floating Over Map */}
          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none flex flex-col items-center gap-2">
            <SurgeAdvisoryBanner 
              flags={surgeFlags} 
              onActionClick={(id) => handleDistrictSelect(id)}
              className="pointer-events-auto w-full max-w-2xl mx-auto"
            />
            
            {/* Location Detection Button (if error or manual trigger) */}
            <div className="pointer-events-auto flex flex-col items-center">
              <button 
                onClick={() => handleDetectLocation()}
                disabled={isDetectingLocation}
                className="bg-bg-secondary text-text-primary shadow-elevated rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                <MapPin className="h-4 w-4 text-community" />
                {isDetectingLocation ? "Detecting..." : "Use My Location"}
              </button>
              {locationError && (
                <span className="text-xs text-error font-medium bg-error-subtle px-2 py-1 rounded mt-1 shadow-sm">
                  {locationError}
                </span>
              )}
            </div>
          </div>

          <MapWrapper 
            districts={districts}
            surgeFlags={surgeFlags}
            selectedDistrictId={selectedDistrictId}
            onDistrictSelect={handleDistrictSelect}
          />

          {/* Floating Report Button (Bottom Center) */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="pointer-events-auto bg-community hover:bg-community-text text-white font-semibold py-3 px-6 rounded-full shadow-elevated flex items-center gap-2 transition-transform hover:scale-105"
            >
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              Report Symptoms
            </button>
          </div>
        </main>
      </div>

      <DistrictDetailDrawer 
        district={districtDetail}
        safeTime={safeTime}
        isOpen={selectedDistrictId !== null}
        onClose={closeDrawer}
        isLoading={isDrawerLoading}
      />

      <SymptomReportModal
        districtId={selectedDistrictId || (districts[0]?.district_id || "")}
        districtName={districtDetail?.name || "your area"}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          // Re-fetch data on success to show updated UI
          fetch("/api/v1/districts").then(r => r.json()).then(j => {
            if (j.success) setDistricts(j.data);
          });
          if (selectedDistrictId) {
             fetch(`/api/v1/districts/${selectedDistrictId}`).then(r => r.json()).then(j => {
              if (j.success) setDistrictDetail(j.data);
            });
          }
        }}
      />
    </div>
  );
}
