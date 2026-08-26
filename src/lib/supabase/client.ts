import { createClient, SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Supabase Client Singletons
// Two clients serve different access patterns:
//   • supabase       — anon key, respects RLS (public reads, client-facing)
//   • supabaseAdmin  — service role key, bypasses RLS (cron writes, inserts)
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// --- Public (anon) client ---------------------------------------------------
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/** Backward-compat default export */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Admin (service role) client --------------------------------------------
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not set. Cannot create admin client."
      );
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabaseAdmin;
}
