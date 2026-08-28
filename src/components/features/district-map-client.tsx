"use client";

import React, { useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DistrictListItem, RiskTier, SurgeFlagItem } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────
const LAHORE_CENTER: [number, number] = [31.5204, 74.3587];
const DEFAULT_ZOOM = 12;

// ─── Map Controller: fly to selected district ────────────────
function MapController({
  selectedId,
  districts,
}: {
  selectedId: string | null;
  districts: DistrictListItem[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const target = districts.find((d) => d.district_id === selectedId);
      if (target) {
        map.flyTo([target.centroid_lat, target.centroid_lng], 13, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedId, districts, map]);

  return null;
}

// ─── Recenter Button: custom Leaflet control overlay ─────────
function RecenterButton() {
  const map = useMap();

  const handleRecenter = useCallback(() => {
    map.flyTo(LAHORE_CENTER, DEFAULT_ZOOM, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [map]);

  return (
    <div className="recenter-control">
      <button
        onClick={handleRecenter}
        title="Center on Lahore"
        aria-label="Center map on Lahore"
        className="recenter-button"
      >
        {/* Crosshair SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        <span className="recenter-label">Lahore</span>
      </button>
    </div>
  );
}

// ─── Risk tier → fill color ──────────────────────────────────
const getRiskColor = (tier: RiskTier | null) => {
  switch (tier) {
    case "low":
      return "#15803d";
    case "moderate":
      return "#ca8a04";
    case "high":
      return "#ea580c";
    case "very_high":
      return "#b91c1c";
    default:
      return "#94a3b8";
  }
};

// ─── Component ───────────────────────────────────────────────
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
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={LAHORE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        {/* ── Tile Layers via LayersControl ─────────────────── */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite View">
            <LayerGroup>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
              />
            </LayerGroup>
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* ── Recenter button ──────────────────────────────── */}
        <RecenterButton />

        {/* ── Controller: fly-to on selection ──────────────── */}
        <MapController
          selectedId={selectedDistrictId}
          districts={districts}
        />

        {/* ── 1. Base Layer: District AQI Circles ──────────── */}
        {districts.map((district) => {
          const isSelected = selectedDistrictId === district.district_id;
          const isSurge = surgeFlags.some(
            (f) => f.district_id === district.district_id
          );
          // Gracefully handle null AQI — render gray circle
          const hasData =
            district.aqi !== null && district.aqi !== undefined;
          const markerColor = hasData
            ? getRiskColor(district.risk_tier)
            : "#475569";

          return (
            <CircleMarker
              key={`aqi-${district.district_id}`}
              center={[district.centroid_lat, district.centroid_lng]}
              radius={isSelected ? 45 : 30}
              pathOptions={{
                fillColor: markerColor,
                fillOpacity: hasData ? 0.3 : 0.5,
                color: isSurge ? "#db2777" : markerColor,
                weight: isSurge ? 4 : isSelected ? 3 : hasData ? 1 : 2,
                dashArray: isSurge
                  ? "5, 5"
                  : hasData
                  ? undefined
                  : "4, 4",
                // Fix 4: pointer cursor on hover
                className: "district-circle-interactive",
              }}
              eventHandlers={{
                click: () => onDistrictSelect(district.district_id),
              }}
            >
              <Tooltip 
                direction="top" 
                sticky 
                opacity={1}
                className="font-inter bg-white text-slate-800 p-2 px-3 rounded-2xl shadow-xl border border-slate-200 text-sm font-semibold !whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <span>{district.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-brand">AQI: {district.aqi ?? 'Pending'}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* ── 2. Overlay Layer: Community Signal (Symptom Clusters) */}
        {districts.map((district) => {
          const reports = district.symptom_reports_today;
          if (reports === 0) return null;

          const visualDotsCount = Math.min(reports, 10);

          return Array.from({ length: visualDotsCount }).map((_, i) => {
            const latOffset = (Math.random() - 0.5) * 0.015;
            const lngOffset = (Math.random() - 0.5) * 0.015;

            return (
              <CircleMarker
                key={`symptom-${district.district_id}-${i}`}
                center={[
                  district.centroid_lat + latOffset,
                  district.centroid_lng + lngOffset,
                ]}
                radius={4}
                pathOptions={{
                  fillColor: "#7c3aed",
                  fillOpacity: 0.9,
                  color: "#ffffff",
                  weight: 1.5,
                }}
                interactive={false}
              />
            );
          });
        })}
      </MapContainer>
    </div>
  );
}
