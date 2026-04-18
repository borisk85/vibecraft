import { createClient } from "@supabase/supabase-js";

/*
  Server-only Supabase client с service_role ключом. Bypass RLS,
  поэтому использовать ТОЛЬКО на сервере (API-роуты, server-actions).
  Никогда не импортировать в client-компоненты.
*/
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
