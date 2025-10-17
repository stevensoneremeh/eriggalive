import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'

export interface AdminAuthResult {
  isAdmin: boolean
  user: any | null
  profile: any | null
  error?: string
}

/**
 * Verify admin access using the established pattern:
 * - info@eriggalive.com email (always admin)
 * - admin or super_admin role
 * - enterprise tier
 */
export async function verifyAdminAccess(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        profile: null,
        error: 'Authentication required',
      }
    }

    // Special case: Always allow info@eriggalive.com
    if (user.email === 'info@eriggalive.com') {
      return {
        isAdmin: true,
        user,
        profile: { email: user.email, role: 'super_admin' },
      }
    }

    // Check user profile for admin access
    const profileResult = await db.execute(sql`
      SELECT role, tier FROM users WHERE auth_user_id = ${user.id} LIMIT 1
    `)
    // Drizzle returns { rows: [...] }, not a direct array
    const profile = (profileResult as any).rows?.[0] || (profileResult as any[])[0]

    const isAdmin =
      profile?.role === 'admin' ||
      profile?.role === 'super_admin' ||
      profile?.tier === 'enterprise'

    if (!isAdmin) {
      return {
        isAdmin: false,
        user,
        profile,
        error: 'Insufficient privileges',
      }
    }

    return {
      isAdmin: true,
      user,
      profile,
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return {
      isAdmin: false,
      user: null,
      profile: null,
      error: 'Authentication failed',
    }
  }
}
