import { createClient } from "@supabase/supabase-js";

// Fix: Use valid dummy URL for Vercel build - Supabase library rejects empty strings
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
);