"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
  showMetrics: boolean;
  setShowMetrics: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardContext = createContext<DashboardContextType>({
  showMetrics: true,
  setShowMetrics: () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [showMetrics, setShowMetrics] = useState(true);

  return (
    <DashboardContext.Provider value={{ showMetrics, setShowMetrics }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
