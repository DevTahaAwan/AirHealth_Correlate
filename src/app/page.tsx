"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MapWrapper } from "@/components/features/map-wrapper";
import { SurgeAdvisoryBanner } from "@/components/ui/surge-advisory-banner";
import { DistrictListItem, SurgeFlagItem } from "@/lib/types";
import { MapPin } from "lucide-react";
import { getNearestDistrictFromList } from "@/lib/utils/geolocation";
import { useAqiMonitor } from "@/lib/hooks/use-aqi-monitor";
import { useToast } from "@/lib/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<DistrictListItem[]>([]);
  const [surgeFlags, setSurgeFlags] = useState<SurgeFlagItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { showToast } = useToast();

  // Phase 4: Monitor AQI for the currently selected district on dashboard
  useAqiMonitor(selectedDistrictId);

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

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    try {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported");
        setIsDetectingLocation(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = getNearestDistrictFromList(latitude, longitude, districts);

        if (nearest) {
          setSelectedDistrictId(nearest.district_id);
          setLocationError(null);
        } else {
          setLocationError("Could not find a nearby district.");
        }
        setIsDetectingLocation(false);
      }, (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          showToast({
            title: "Location access denied",
            message: "Please enable it in your browser settings.",
            variant: "error",
          });
        }
        setLocationError("Location access denied. Please enable permissions in your browser settings.");
        setIsDetectingLocation(false);
      });
      
    } catch {
      setLocationError("Location access failed.");
      setIsDetectingLocation(false);
    }
  };

  // Navigate to dedicated district page via router.push (SPA-like transition)
  const handleDistrictSelect = (districtId: string) => {
    const district = districts.find(d => d.district_id === districtId);
    if (district) {
      router.push(`/districts/${district.slug}`);
    } else {
      // Fallback: try to find by ID pattern
      setSelectedDistrictId(districtId);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar selectedDistrictId={selectedDistrictId} />
        
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
                onClick={handleDetectLocation}
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
        </main>
      </div>


    </div>
  );
}
