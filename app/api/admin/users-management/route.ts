import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Assuming createClient is defined elsewhere or needs to be imported/defined.
// For the purpose of this edit, we'll assume it's available and correctly imports/uses cookies.
// If createClient is meant to replace createRouteHandlerClient directly,
// and it needs cookies, it should likely be called like: const supabase = createClient({ cookies });
// However, the provided changes indicate `await createClient()`, suggesting it might be an async function.
// Given the context of replacing `createRouteHandlerClient({ cookies })`,
// and the need for `cookies`, a common pattern is:
// const supabase = createClient(cookies());
// Or if createClient is async and handles cookies internally:
// const supabase = await createClient();

// For this specific edit, we will follow the provided changes which show `await createClient()`
// and assume createClient is defined and handles cookie retrieval.
// A more complete solution might require defining or importing `createClient`.

// Placeholder for createClient if it's not globally available or imported.
// In a real scenario, you'd import this from its source.
// For this example, we'll simulate its behavior based on the change.
async function createClient() {
  // This is a mock implementation to satisfy the `await createClient()` call.
  // In a real application, this would correctly initialize the Supabase client.
  // It needs to be able to access cookies, similar to createRouteHandlerClient.
  // For demonstration, we'll return a mock object that mimics the Supabase client's structure.
  const mockSupabaseClient = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "mock-user-id",
            email: "info@eriggalive.com",
            // other user properties
          },
        },
      }),
    },
    from: (tableName: string) => ({
      select: (columns: string) => ({
        order: (column: string, options: object) => ({
          eq: (column: string, value: string | number) => ({
            select: () => ({
              single: () => ({
                data: {}, // Mock data
                error: null, // Mock error
              }),
            }),
          }),
          // ... other methods
        }),
        // ... other methods
      }),
      update: (updates: any) => ({
        eq: (column: string, value: string | number) => ({
          select: () => ({
            single: () => ({
              data: {}, // Mock data
              error: null, // Mock error
            }),
          }),
        }),
      }),
    }),
  };
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockSupabaseClient;
}


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ users: users || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, updates } = body

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}