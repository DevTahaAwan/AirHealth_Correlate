import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RespiratoryCondition } from "@/lib/types";

export interface UserProfile {
  full_name: string;
  age_group: string;
  conditions: RespiratoryCondition[];
  exposure_level: string;
  home_district_id: string | null;
  profile_completed: boolean;
}

export function useUserProfile() {
  const { user, supabase, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (authLoading) {
        return;
      }

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile", error);
        }

        if (data) {
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, supabase, authLoading]);

  return { profile, loading };
}
