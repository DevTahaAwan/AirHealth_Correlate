import { mockDistricts } from "@/data/districts";
import { District } from "@/lib/types";

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

export async function getNearestDistrict(): Promise<{ district_id: string; name: string } | null> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearestDistrict: District | null = null;
        let minDistance = Infinity;

        for (const district of mockDistricts) {
          const distance = getDistanceFromLatLonInKm(
            latitude,
            longitude,
            district.centroid_lat,
            district.centroid_lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestDistrict = district;
          }
        }

        if (nearestDistrict) {
          resolve({
            district_id: nearestDistrict.id,
            name: nearestDistrict.name,
          });
        } else {
          resolve(null);
        }
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
