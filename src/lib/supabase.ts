import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ssggtgkvgzinbxumwanl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UBmn4hahzgCnZqmCLwEwBA_Yz54HI86";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "dasy_auth",
  },
});

export const isSupabaseConfigured = true;
