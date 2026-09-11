import { mockDistricts } from "@/data/districts";

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

/**
 * Pure utility: given user coordinates and a list of districts (with centroid_lat/centroid_lng),
 * returns the nearest district using accurate Haversine distance.
 * Used by both Dashboard (page.tsx) and Profile (profile/page.tsx) for consistent results.
 */
export function getNearestDistrictFromList(
  userLat: number,
  userLng: number,
  districts: { district_id: string; name: string; centroid_lat: number; centroid_lng: number }[]
): { district_id: string; name: string } | null {
  let nearestId: string | null = null;
  let nearestName: string | null = null;
  let minDistance = Infinity;

  for (const d of districts) {
    const distance = getDistanceFromLatLonInKm(
      userLat,
      userLng,
      d.centroid_lat,
      d.centroid_lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestId = d.district_id;
      nearestName = d.name;
    }
  }

  if (nearestId && nearestName) {
    return { district_id: nearestId, name: nearestName };
  }
  return null;
}

/**
 * Browser geolocation wrapper that resolves the nearest district from the static mockDistricts list.
 * Used by the Profile page for initial location detection.
 */
export async function getNearestDistrict(): Promise<{ district_id: string; name: string } | null> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Map mockDistricts to the shape expected by getNearestDistrictFromList
        const mapped = mockDistricts.map(d => ({
          district_id: d.id,
          name: d.name,
          centroid_lat: d.centroid_lat,
          centroid_lng: d.centroid_lng,
        }));
        resolve(getNearestDistrictFromList(latitude, longitude, mapped));
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
