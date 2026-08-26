"use client";

/**
 * Anonymous Identity Shim
 *
 * This file replaces the former Clerk-mock auth system. There is no longer any
 * concept of "signed in / signed out". Every visitor is identified by a stable
 * Anonymous Device UUID stored in localStorage.
 *
 * Backward-compatible exports (`useAuth`, `useUser`) are kept so existing
 * import paths across the codebase continue to compile without further changes.
 */

import { useState, useEffect } from "react";
import { getDeviceId } from "@/lib/utils/device-id";

// ---------------------------------------------------------------------------
// Core hook — returns the device UUID once the component mounts on the client
// ---------------------------------------------------------------------------
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  return deviceId;
}

// ---------------------------------------------------------------------------
// Backward-compatible shim for components that previously used `useAuth()`
// Always reports "signed in" with the device UUID as the userId.
// ---------------------------------------------------------------------------
export function useAuth() {
  const deviceId = useDeviceId();

  return {
    isLoaded: deviceId !== null,
    isSignedIn: true,   // always true — no login required
    userId: deviceId,
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible shim for components that previously used `useUser()`
// ---------------------------------------------------------------------------
export function useUser() {
  const deviceId = useDeviceId();

  return {
    isLoaded: deviceId !== null,
    isSignedIn: true,
    user: deviceId ? { id: deviceId } : null,
  };
}
