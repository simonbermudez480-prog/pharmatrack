import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase con la SERVICE_ROLE key (server only, salta RLS).
 * NUNCA exponer esta key en el frontend. Úsala solo en Route Handlers
 * del backend (webhooks, jobs).
 */
export async function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL");
  }

  const cookieStore = await cookies();

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // admin client no necesita setear cookies
      },
    },
  });
}
