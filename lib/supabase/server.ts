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

export function createMockServerClient(): SupabaseClient<Database> {
  console.warn("⚠️ Using mock server client - Supabase environment variables not configured");

  const mockQueryBuilder = {
    eq: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    is: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null })
  };

  // @ts-expect-error - minimal mock
  return {
    from: () => ({
      select: () => mockQueryBuilder,
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      upsert: () => Promise.resolve({ data: [], error: null }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null })
    },
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
    }
  };
}

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

export function createServerSupabaseClientWithAuth(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient();

  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")
        }
      }
    });
  } catch (error) {
    console.warn("Failed to create authenticated Supabase client, falling back to mock:", error);
    return createMockServerClient();
  }
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });
  } catch (error) {
    console.warn("Failed to create admin Supabase client, falling back to mock:", error);
    return createMockServerClient();
  }
}

export const getServerClient = createServerClient;
