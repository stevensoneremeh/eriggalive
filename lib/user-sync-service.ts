import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface SyncOptions {
  dryRun?: boolean
  deleteOrphaned?: boolean
  updateExisting?: boolean
  createMissing?: boolean
}

interface SyncResult {
  success: boolean
  processed: number
  created: number
  updated: number
  deleted: number
  errors: string[]
  orphanedAuth: string[]
  orphanedDatabase: number[]
  details?: any
}

interface IntegrityIssue {
  type: string
  description: string
  userId?: string | number
}

interface IntegrityCheckResult {
  issues: IntegrityIssue[]
  totalUsers: number
  authUsers: number
  databaseUsers: number
}

class UserSyncService {
  private async logSyncOperation(syncType: string, status: string, options: SyncOptions, result: Partial<SyncResult>) {
    try {
      const supabase = await createServerSupabaseClient()

      await supabase.from("sync_logs").insert({
        sync_type: syncType,
        status,
        dry_run: options.dryRun || false,
        processed_count: result.processed || 0,
        created_count: result.created || 0,
        updated_count: result.updated || 0,
        deleted_count: result.deleted || 0,
        error_count: result.errors?.length || 0,
        details: {
          options,
          errors: result.errors || [],
          orphanedAuth: result.orphanedAuth || [],
          orphanedDatabase: result.orphanedDatabase || [],
        },
      })
    } catch (error) {
      console.error("Failed to log sync operation:", error)
    }
  }

  async checkDataIntegrity(): Promise<IntegrityCheckResult> {
    const issues: IntegrityIssue[] = []

    try {
      const supabase = await createServerSupabaseClient()

      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) throw authError

      // Get all database users
      const { data: dbUsers, error: dbError } = await supabase.from("users").select("*")
      if (dbError) throw dbError

      const authUserIds = new Set(authUsers.users.map((u) => u.id))
      const dbUserAuthIds = new Set(dbUsers.map((u) => u.auth_user_id).filter(Boolean))

      // Find orphaned auth users (in auth but not in database)
      const orphanedAuthUsers = authUsers.users.filter((u) => !dbUserAuthIds.has(u.id))
      orphanedAuthUsers.forEach((user) => {
        issues.push({
          type: "orphaned_auth_user",
          description: `Auth user ${user.email} exists but has no database record`,
          userId: user.id,
        })
      })

      // Find orphaned database users (in database but not in auth)
      const orphanedDbUsers = dbUsers.filter((u) => u.auth_user_id && !authUserIds.has(u.auth_user_id))
      orphanedDbUsers.forEach((user) => {
        issues.push({
          type: "orphaned_database_user",
          description: `Database user ${user.username} references non-existent auth user`,
          userId: user.id,
        })
      })

      // Check for data inconsistencies
      for (const dbUser of dbUsers) {
        if (!dbUser.auth_user_id) continue

        const authUser = authUsers.users.find((u) => u.id === dbUser.auth_user_id)
        if (!authUser) continue

        // Check email consistency
        if (dbUser.email !== authUser.email) {
          issues.push({
            type: "email_mismatch",
            description: `Email mismatch: DB has ${dbUser.email}, Auth has ${authUser.email}`,
            userId: dbUser.id,
          })
        }

        // Check for invalid data
        if (dbUser.coins < 0) {
          issues.push({
            type: "negative_coins",
            description: `User ${dbUser.username} has negative coins: ${dbUser.coins}`,
            userId: dbUser.id,
          })
        }

        if (!dbUser.email || !dbUser.email.includes("@")) {
          issues.push({
            type: "invalid_email",
            description: `User ${dbUser.username} has invalid email: ${dbUser.email}`,
            userId: dbUser.id,
          })
        }
      }

      // Check for duplicate usernames
      const usernames = dbUsers.map((u) => u.username).filter(Boolean)
      const duplicateUsernames = usernames.filter((username, index) => usernames.indexOf(username) !== index)

      duplicateUsernames.forEach((username) => {
        issues.push({
          type: "duplicate_username",
          description: `Duplicate username found: ${username}`,
        })
      })

      return {
        issues,
        totalUsers: Math.max(authUsers.users.length, dbUsers.length),
        authUsers: authUsers.users.length,
        databaseUsers: dbUsers.length,
      }
    } catch (error) {
      console.error("Error checking data integrity:", error)
      return {
        issues: [
          {
            type: "integrity_check_failed",
            description: `Failed to check data integrity: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        totalUsers: 0,
        authUsers: 0,
        databaseUsers: 0,
      }
    }
  }

  async syncUsers(options: SyncOptions = {}): Promise<SyncResult> {
    const { dryRun = true, deleteOrphaned = false, updateExisting = true, createMissing = true } = options

    const result: SyncResult = {
      success: false,
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      orphanedAuth: [],
      orphanedDatabase: [],
    }

    try {
      console.log(`Starting user sync (dry run: ${dryRun})...`)

      const supabase = await createServerSupabaseClient()

      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) {
        throw new Error(`Failed to fetch auth users: ${authError.message}`)
      }

      // Get all database users
      const { data: dbUsers, error: dbError } = await supabase.from("users").select("*")
      if (dbError) {
        throw new Error(`Failed to fetch database users: ${dbError.message}`)
      }

      result.processed = authUsers.users.length

      // Create maps for efficient lookup
      const dbUsersByAuthId = new Map(dbUsers.map((user) => [user.auth_user_id, user]).filter(([authId]) => authId))
      const authUsersById = new Map(authUsers.users.map((user) => [user.id, user]))

      // Process auth users
      for (const authUser of authUsers.users) {
        try {
          const existingDbUser = dbUsersByAuthId.get(authUser.id)

          if (!existingDbUser && createMissing) {
            // Create missing database user
            const newUser = {
              auth_user_id: authUser.id,
              email: authUser.email || "",
              username:
                authUser.user_metadata?.username || authUser.email?.split("@")[0] || `user_${authUser.id.slice(0, 8)}`,
              full_name: authUser.user_metadata?.full_name || "",
              avatar_url: authUser.user_metadata?.avatar_url || null,
              tier: "grassroot" as const,
              coins: 0,
              level: 1,
              points: 0,
              role: "user" as const,
              is_active: true,
            }

            if (!dryRun) {
              const { error: insertError } = await supabase.from("users").insert(newUser)

              if (insertError) {
                result.errors.push(`Failed to create user ${authUser.email}: ${insertError.message}`)
                continue
              }
            }

            result.created++
            console.log(`${dryRun ? "[DRY RUN] " : ""}Created user: ${authUser.email}`)
          } else if (existingDbUser && updateExisting) {
            // Update existing user if data differs
            const updates: Partial<UserProfile> = {}

            if (existingDbUser.email !== authUser.email) {
              updates.email = authUser.email || existingDbUser.email
            }

            if (authUser.user_metadata?.full_name && existingDbUser.full_name !== authUser.user_metadata.full_name) {
              updates.full_name = authUser.user_metadata.full_name
            }

            if (authUser.user_metadata?.avatar_url && existingDbUser.avatar_url !== authUser.user_metadata.avatar_url) {
              updates.avatar_url = authUser.user_metadata.avatar_url
            }

            if (Object.keys(updates).length > 0) {
              if (!dryRun) {
                const { error: updateError } = await supabase.from("users").update(updates).eq("id", existingDbUser.id)

                if (updateError) {
                  result.errors.push(`Failed to update user ${authUser.email}: ${updateError.message}`)
                  continue
                }
              }

              result.updated++
              console.log(`${dryRun ? "[DRY RUN] " : ""}Updated user: ${authUser.email}`)
            }
          }
        } catch (error) {
          const errorMessage = `Error processing auth user ${authUser.email}: ${error instanceof Error ? error.message : "Unknown error"}`
          result.errors.push(errorMessage)
          console.error(errorMessage)
        }
      }

      // Find orphaned database users
      const orphanedDbUsers = dbUsers.filter((dbUser) => dbUser.auth_user_id && !authUsersById.has(dbUser.auth_user_id))

      result.orphanedDatabase = orphanedDbUsers.map((user) => user.id)

      if (deleteOrphaned && orphanedDbUsers.length > 0) {
        for (const orphanedUser of orphanedDbUsers) {
          try {
            if (!dryRun) {
              // Soft delete by marking as inactive
              const { error: deleteError } = await supabase
                .from("users")
                .update({ is_active: false, deleted_at: new Date().toISOString() })
                .eq("id", orphanedUser.id)

              if (deleteError) {
                result.errors.push(`Failed to delete orphaned user ${orphanedUser.username}: ${deleteError.message}`)
                continue
              }
            }

            result.deleted++
            console.log(`${dryRun ? "[DRY RUN] " : ""}Soft deleted orphaned user: ${orphanedUser.username}`)
          } catch (error) {
            const errorMessage = `Error deleting orphaned user ${orphanedUser.username}: ${error instanceof Error ? error.message : "Unknown error"}`
            result.errors.push(errorMessage)
            console.error(errorMessage)
          }
        }
      }

      // Find orphaned auth users
      result.orphanedAuth = authUsers.users
        .filter((authUser) => !dbUsersByAuthId.has(authUser.id))
        .map((user) => user.id)

      result.success = result.errors.length === 0

      console.log(
        `Sync completed: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted, ${result.errors.length} errors`,
      )

      // Log the operation
      await this.logSyncOperation("manual", result.success ? "completed" : "failed", options, result)

      return result
    } catch (error) {
      const errorMessage = `Sync operation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      result.errors.push(errorMessage)
      console.error(errorMessage)

      await this.logSyncOperation("manual", "failed", options, result)

      return result
    }
  }

  async getSyncLogs(limit = 50) {
    try {
      const supabase = await createServerSupabaseClient()

      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error fetching sync logs:", error)
      return []
    }
  }
}

export const userSyncService = new UserSyncService()
