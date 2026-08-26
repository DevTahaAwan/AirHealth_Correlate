"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { DistrictListItem, SurgeFlagItem } from "@/lib/types";

// Leaflet doesn't support SSR, so we dynamically import the actual map component
const DistrictMap = dynamic(
  () => import("./district-map-client").then((mod) => mod.DistrictMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
        <SkeletonLoader className="w-full h-full absolute inset-0" />
        <div className="z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          <p className="text-text-secondary font-medium">Loading Map Data...</p>
        </div>
      </div>
    ),
  }
);

interface MapWrapperProps {
  districts: DistrictListItem[];
  surgeFlags: SurgeFlagItem[];
  onDistrictSelect: (id: string) => void;
  selectedDistrictId: string | null;
}

export function MapWrapper(props: MapWrapperProps) {
  // Ensure we only render the map after the component mounts on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <DistrictMap {...props} />;
}
