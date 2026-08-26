/**
 * Anonymous Device Identity Utility
 *
 * Provides a stable, anonymous UUID that persists in localStorage and acts as
 * the user identity for the entire application (no login required).
 *
 * The `typeof window !== "undefined"` guard ensures this never throws during
 * Next.js server-side rendering or static generation.
 */

const DEVICE_ID_KEY = "device_id";

/**
 * Returns the device UUID from localStorage, creating one if it doesn't exist.
 * Returns `null` when called on the server (SSR / edge runtime).
 */
export function getDeviceId(): string | null {
  if (typeof window === "undefined") {
    // Server-side: localStorage is not available
    return null;
  }

  let id = localStorage.getItem(DEVICE_ID_KEY);

  if (!id) {
    // Generate a RFC-4122 compliant UUID (supported in all modern browsers)
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }

  return id;
}
