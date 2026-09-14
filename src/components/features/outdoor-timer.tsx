"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OutdoorTimerProps {
  safeMinutes: number;
}

export function OutdoorTimer({ safeMinutes }: OutdoorTimerProps) {
  const { showToast } = useToast();
  
  // States
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(safeMinutes * 60);
  const [hasWarned, setHasWarned] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from session storage if available to persist across navigation
  useEffect(() => {
    const saved = sessionStorage.getItem("airhealth_outdoor_timer");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timeRemaining > 0) {
          setTimeRemaining(parsed.timeRemaining);
          setIsActive(parsed.isActive);
          setHasWarned(parsed.hasWarned);
        }
      } catch {
        // Ignored
      }
    } else {
      setTimeRemaining(safeMinutes * 60);
    }
    
    // Request notification permission if not granted
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [safeMinutes]);

  // Handle timer tick
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          
          // Warning at exactly 10 minutes (600 seconds)
          if (next === 600 && !hasWarned) {
            setHasWarned(true);
            showToast({
              title: "Exposure Warning",
              message: "Approaching maximum safe PM2.5 exposure. Please head indoors soon.",
              variant: "warning",
              duration: 10000,
            });
            
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("AirHealth Warning", {
                body: "Approaching maximum safe PM2.5 exposure. Please head indoors soon.",
                icon: "/favicon.ico"
              });
            }
          }
          
          // Timer finished
          if (next <= 0) {
            setIsActive(false);
            showToast({
              title: "Time's Up!",
              message: "You have reached your maximum safe outdoor exposure time.",
              variant: "error",
              duration: Infinity,
            });
            
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("AirHealth Alert: Time's Up!", {
                body: "You have reached your maximum safe outdoor exposure time. Please seek indoor shelter.",
                icon: "/favicon.ico"
              });
            }
            return 0;
          }
          
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeRemaining, hasWarned, showToast]);

  // Persist state
  useEffect(() => {
    sessionStorage.setItem("airhealth_outdoor_timer", JSON.stringify({
      timeRemaining,
      isActive,
      hasWarned
    }));
  }, [timeRemaining, isActive, hasWarned]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(safeMinutes * 60);
    setHasWarned(false);
    sessionStorage.removeItem("airhealth_outdoor_timer");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = safeMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / totalSeconds) * 100));
  
  let statusColor = "bg-brand";
  if (progressPercent < 15) statusColor = "bg-error";
  else if (progressPercent < 35) statusColor = "bg-warning";

  if (safeMinutes >= 999) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-border-default bg-bg-primary text-center">
        <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
        <h4 className="font-semibold text-text-primary">Conditions Are Safe</h4>
        <p className="text-sm text-text-secondary mt-1">No timer required for current air quality.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-border-default rounded-xl overflow-hidden bg-bg-primary">
      <div className="p-4 flex flex-col items-center">
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Outdoor Exposure Timer</h4>
        
        <div className="text-5xl font-mono font-black text-text-primary my-2 tracking-tighter">
          {formatTime(timeRemaining)}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-bg-tertiary rounded-full mt-3 mb-5 overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000 ease-linear", statusColor)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={toggleTimer}
            disabled={timeRemaining <= 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm disabled:opacity-50",
              isActive 
                ? "bg-bg-tertiary text-text-primary border border-border-default hover:bg-border-subtle" 
                : "bg-brand text-white hover:bg-brand-hover"
            )}
          >
            {isActive ? (
              <><Pause className="h-4 w-4" /> Pause</>
            ) : (
              <><Play className="h-4 w-4" /> Start</>
            )}
          </button>
          
          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-text-secondary bg-bg-tertiary hover:bg-border-default border border-border-default transition-all shadow-sm"
          >
            <Square className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
      
      {hasWarned && timeRemaining > 0 && (
        <div className="bg-warning-subtle p-3 flex items-start gap-2 border-t border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning-text font-medium leading-relaxed">
            Approaching limit. Consider heading indoors or wearing an N95 mask.
          </p>
        </div>
      )}
    </div>
  );
}
