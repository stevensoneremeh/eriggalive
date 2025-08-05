import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for development
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
        }),
        insert: (data: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: (columns?: string) => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ error: null }),
        }),
      }),
      rpc: (functionName: string, params?: any) => Promise.resolve({ data: null, error: null }),
    } as any
  }
}

export const getServerClient = createServerClient
