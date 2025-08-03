import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";
import { cookies } from "next/headers";

export const isProduction = () => process.env.NODE_ENV === "production";
export const isDevelopment = () => process.env.NODE_ENV === "development";

export const isPreviewMode = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

/**
 * In production, mock client is removed — this will throw if env vars are missing
 */
export function createMockServerClient(): SupabaseClient<Database> {
  throw new Error(
    "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

export function createServerSupabaseClientWithAuth(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient();

  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Cookie: cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; "),
      },
    },
  });
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export const getServerClient = createServerClient;
