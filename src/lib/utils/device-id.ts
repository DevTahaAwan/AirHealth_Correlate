export function getOrCreateDeviceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  const key = "airhealth_device_id";
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
}

export const getDeviceId = getOrCreateDeviceId;
