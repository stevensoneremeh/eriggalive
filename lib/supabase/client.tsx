;/import { createBrowserClient } from "@supabase/rss
"

/**
 * Reads an env var safely. Works in both browser & server.
 */
function readEnv(key: string) {
  // @ts-expect-error next-lite injects env vars on globalThis
  return typeof process !== "undefined" ? process.env[key] : (globalThis as any)[key]
}

export function createClient() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") || readEnv("SUPABASE_URL") || ""
  const anon = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || readEnv("SUPABASE_ANON_KEY") || ""

  return createBrowserClient(url, anon)
}
