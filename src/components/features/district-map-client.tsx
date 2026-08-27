"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DistrictListItem, RiskTier, SurgeFlagItem } from "@/lib/types";

// Helper to center map if selected district changes
function MapController({ selectedId, districts }: { selectedId: string | null, districts: DistrictListItem[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedId) {
      const target = districts.find(d => d.district_id === selectedId);
      if (target) {
        map.flyTo([target.centroid_lat, target.centroid_lng], 13, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [selectedId, districts, map]);
  
  return null;
}

const getRiskColor = (tier: RiskTier | null) => {
  switch (tier) {
    case "low": return "#15803d";
    case "moderate": return "#ca8a04";
    case "high": return "#ea580c";
    case "very_high": return "#b91c1c";
    default: return "#94a3b8";
  }
};

interface DistrictMapClientProps {
  districts: DistrictListItem[];
  surgeFlags: SurgeFlagItem[];
  onDistrictSelect: (id: string) => void;
  selectedDistrictId: string | null;
}

export function DistrictMapClient({
  districts,
  surgeFlags,
  onDistrictSelect,
  selectedDistrictId,
}: DistrictMapClientProps) {
  const lahoreCenter: [number, number] = [31.5204, 74.3587];
  
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={lahoreCenter}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapController selectedId={selectedDistrictId} districts={districts} />

        {/* 1. Base Layer: District Air Quality Centroids (In reality, polygons) */}
        {districts.map((district) => {
          const isSelected = selectedDistrictId === district.district_id;
          const isSurge = surgeFlags.some(f => f.district_id === district.district_id);
          // Fix 3: Gracefully handle null AQI — render gray circle instead of disappearing
          const hasData = district.aqi !== null && district.aqi !== undefined;
          const markerColor = hasData ? getRiskColor(district.risk_tier) : "#CBD5E1";

          return (
            <CircleMarker
              key={`aqi-${district.district_id}`}
              center={[district.centroid_lat, district.centroid_lng]}
              radius={isSelected ? 45 : 30}
              pathOptions={{
                fillColor: markerColor,
                fillOpacity: hasData ? 0.3 : 0.15,
                color: isSurge ? "#db2777" : markerColor,
                weight: isSurge ? 4 : (isSelected ? 3 : 1),
                dashArray: isSurge ? "5, 5" : (hasData ? undefined : "4, 4"),
              }}
              eventHandlers={{
                click: () => onDistrictSelect(district.district_id),
              }}
            >
              <Tooltip sticky className="font-inter rounded-md border border-border-default">
                <div className="p-1">
                  <p className="font-semibold text-text-primary">{district.name}</p>
                  <p className="text-sm">
                    AQI:{" "}
                    {hasData ? (
                      <span className="font-medium" style={{ color: markerColor }}>
                        {district.aqi}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">No Data</span>
                    )}
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* 2. Overlay Layer: Community Signal (Symptom Clusters) */}
        {districts.map((district) => {
          // Generate small random offset clusters based on report count for visualization
          const reports = district.symptom_reports_today;
          if (reports === 0) return null;
          
          // Limit to max 10 dots visually per district to avoid clutter
          const visualDotsCount = Math.min(reports, 10);
          
          return Array.from({ length: visualDotsCount }).map((_, i) => {
            // Random offset within ~1.5km of centroid
            const latOffset = (Math.random() - 0.5) * 0.015;
            const lngOffset = (Math.random() - 0.5) * 0.015;
            
            return (
              <CircleMarker
                key={`symptom-${district.district_id}-${i}`}
                center={[district.centroid_lat + latOffset, district.centroid_lng + lngOffset]}
                radius={4}
                pathOptions={{
                  fillColor: "#7c3aed", // Community Violet
                  fillOpacity: 0.9,
                  color: "#ffffff",
                  weight: 1.5,
                }}
                interactive={false} // Don't block clicks to the main district polygon
              />
            );
          });
        })}
      </MapContainer>
    </div>
  );
}
