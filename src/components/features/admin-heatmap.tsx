"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
import L from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface SymptomReport {
  id: string;
  district_id: string;
  district_name: string;
  symptom: string;
  severity: "mild" | "moderate" | "severe";
  timestamp: string;
  lat: number;
  lng: number;
}

interface AdminHeatmapProps {
  reports: SymptomReport[];
}

function HeatmapController({ reports }: { reports: SymptomReport[] }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length > 0) {
      // Center map loosely around reports
      const centerLat = reports.reduce((sum, r) => sum + r.lat, 0) / reports.length;
      const centerLng = reports.reduce((sum, r) => sum + r.lng, 0) / reports.length;
      map.setView([centerLat, centerLng], 12);
    }
  }, [map, reports]);
  return null;
}

export default function AdminHeatmap({ reports }: AdminHeatmapProps) {
  // Lahore coordinates
  const center: [number, number] = [31.5204, 74.3587];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        />
        
        <HeatmapController reports={reports} />

        {reports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.lat, report.lng]}
            radius={report.severity === "severe" ? 12 : report.severity === "moderate" ? 8 : 5}
            pathOptions={{
              color: report.severity === "severe" ? "#ef4444" : report.severity === "moderate" ? "#f97316" : "#eab308",
              fillColor: report.severity === "severe" ? "#ef4444" : report.severity === "moderate" ? "#f97316" : "#eab308",
              fillOpacity: 0.6,
              weight: 1
            }}
          >
            <Popup className="bg-slate-900 border border-slate-800 text-slate-200">
              <div className="p-1">
                <p className="font-bold mb-1 uppercase tracking-wider text-xs border-b border-slate-700 pb-1">{report.district_name}</p>
                <p className="text-sm">Symptom: <span className="font-medium capitalize">{report.symptom.replace("_", " ")}</span></p>
                <p className="text-sm">Severity: <span className="font-medium capitalize">{report.severity}</span></p>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(report.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
