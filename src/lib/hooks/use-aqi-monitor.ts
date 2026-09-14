"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/lib/hooks/use-toast";

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

function getRiskCategory(aqi: number) {
  if (aqi <= 50) return { risk: "low", score: 1 };
  if (aqi <= 100) return { risk: "moderate", score: 2 };
  if (aqi <= 150) return { risk: "high", score: 3 };
  return { risk: "very-high", score: 4 };
}

export function useAqiMonitor(districtId: string | null) {
  const { showToast } = useToast();
  const lastAqiRef = useRef<number | null>(null);

  useEffect(() => {
    if (!districtId) return;

    let timeoutId: NodeJS.Timeout;

    const checkAqi = async () => {
      try {
        const res = await fetch(`/api/v1/districts/${districtId}`);
        const data = await res.json();

        if (data.success && data.data && data.data.aqi) {
          const currentAqi = data.data.aqi;
          
          if (lastAqiRef.current !== null) {
            const previousAqi = lastAqiRef.current;
            const diff = currentAqi - previousAqi;
            
            const prevCat = getRiskCategory(previousAqi);
            const currCat = getRiskCategory(currentAqi);

            // Trigger if spiked by > 30 AND crossed into a higher risk category
            if (diff >= 30 && currCat.score > prevCat.score) {
              showToast({
                title: "AQI Spike Alert",
                message: `AQI has jumped by ${diff} points into the ${currCat.risk.replace("-", " ")} risk category. Consider heading indoors.`,
                variant: "error",
                duration: 15000,
              });
            }
          }
          
          lastAqiRef.current = currentAqi;
        }
      } catch {
        // Silently fail, keep old values
      }
      
      // Schedule next poll
      timeoutId = setTimeout(checkAqi, POLL_INTERVAL);
    };

    // Initial check
    checkAqi();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [districtId, showToast]);
}
