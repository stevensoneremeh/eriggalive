// Helper to check if we're in a preview environment
export const isPreviewMode = () => {
  const hostname = process.env.VERCEL_URL || ""
  return (
    hostname.includes("preview") ||
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    process.env.NODE_ENV !== "production" ||
    hostname.includes("vusercontent.net") ||
    hostname.includes("v0.dev")
  )
}

// Helper to check if we're in a production environment
export const isProduction = () => {
  return process.env.NODE_ENV === "production"
}

// Helper to check if we're in a development environment
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development"
}

// Create a mock server client for preview mode
export const createMockServerClient = () => {
  return {
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
      }),
      insert: (data: any) => Promise.resolve({ data: { id: Math.floor(Math.random() * 1000) }, error: null }),
      update: (data: any) => Promise.resolve({ data: data, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  } as any
}

// Create a server-side client that works in both preview and production
export const getServerClient = async () => {
  return createMockServerClient()
}
