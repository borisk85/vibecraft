import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
  Server-side Supabase client использующий cookies (auth в SSR/server actions).
  Использует anon key — subject to RLS.
*/
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы",
    );
  }
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Вызов в Server Component — setAll игнорируется, это ок (middleware обновит cookies)
        }
      },
    },
  });
}
