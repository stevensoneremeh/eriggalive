import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { auditLogger } from "./audit-logger"

interface Permission {
  resource: string
  action: string
  conditions?: any
}

interface Role {
  name: string
  permissions: Permission[]
  inherits?: string[]
}

export class AuthorizationService {
  private supabase: ReturnType<typeof createClient<Database>>
  private roleHierarchy: Map<string, Role> = new Map()

  constructor() {
    this.supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    this.initializeRoles()
  }

  private initializeRoles() {
    // Define role hierarchy
    const roles: Role[] = [
      {
        name: "user",
        permissions: [
          { resource: "posts", action: "create" },
          { resource: "posts", action: "read" },
          { resource: "posts", action: "update", conditions: { owner: true } },
          { resource: "posts", action: "delete", conditions: { owner: true } },
          { resource: "comments", action: "create" },
          { resource: "comments", action: "read" },
          { resource: "comments", action: "update", conditions: { owner: true } },
          { resource: "comments", action: "delete", conditions: { owner: true } },
          { resource: "profile", action: "read" },
          { resource: "profile", action: "update", conditions: { owner: true } },
          { resource: "coins", action: "spend", conditions: { owner: true } },
          { resource: "media", action: "upload", conditions: { owner: true } },
        ],
      },
      {
        name: "moderator",
        inherits: ["user"],
        permissions: [
          { resource: "posts", action: "moderate" },
          { resource: "comments", action: "moderate" },
          { resource: "users", action: "warn" },
          { resource: "reports", action: "handle" },
        ],
      },
      {
        name: "admin",
        inherits: ["moderator"],
        permissions: [
          { resource: "users", action: "ban" },
          { resource: "users", action: "unban" },
          { resource: "content", action: "manage" },
          { resource: "system", action: "configure" },
          { resource: "audit", action: "read" },
        ],
      },
      {
        name: "super_admin",
        inherits: ["admin"],
        permissions: [
          { resource: "*", action: "*" }, // Full access
        ],
      },
    ]

    // Build role hierarchy
    roles.forEach((role) => {
      this.roleHierarchy.set(role.name, role)
    })
  }

  // Check if user has permission for a specific action
  async hasPermission(userId: string, resource: string, action: string, context?: any): Promise<boolean> {
    try {
      // Get user's roles and permissions
      const userRoles = await this.getUserRoles(userId)
      const userPermissions = await this.getUserPermissions(userId, userRoles)

      // Check direct permissions
      for (const permission of userPermissions) {
        if (this.matchesPermission(permission, resource, action)) {
          // Check conditions if any
          if (permission.conditions) {
            const conditionsMet = await this.checkConditions(permission.conditions, userId, context)
            if (conditionsMet) return true
          } else {
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.error("Permission check error:", error)
      return false
    }
  }

  // Get user's roles
  private async getUserRoles(userId: string): Promise<string[]> {
    const { data: user, error } = await this.supabase
      .from("users")
      .select("role, tier")
      .eq("id", Number.parseInt(userId))
      .single()

    if (error || !user) return ["user"]

    const roles = [user.role || "user"]

    // Add tier-based roles
    if (user.tier === "blood_brotherhood") {
      roles.push("vip")
    }

    return roles
  }

  // Get all permissions for user's roles
  private async getUserPermissions(userId: string, roles: string[]): Promise<Permission[]> {
    const allPermissions: Permission[] = []

    for (const roleName of roles) {
      const permissions = this.getRolePermissions(roleName)
      allPermissions.push(...permissions)
    }

    // Get custom user permissions
    const { data: customPermissions } = await this.supabase
      .from("user_permissions")
      .select("permission")
      .eq("user_id", Number.parseInt(userId))
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())

    if (customPermissions) {
      customPermissions.forEach((cp) => {
        const [resource, action] = cp.permission.split(":")
        allPermissions.push({ resource, action })
      })
    }

    return allPermissions
  }

  // Get permissions for a role (including inherited)
  private getRolePermissions(roleName: string): Permission[] {
    const role = this.roleHierarchy.get(roleName)
    if (!role) return []

    const permissions = [...role.permissions]

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        permissions.push(...this.getRolePermissions(inheritedRole))
      }
    }

    return permissions
  }

  // Check if permission matches resource and action
  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    const resourceMatch = permission.resource === "*" || permission.resource === resource
    const actionMatch = permission.action === "*" || permission.action === action
    return resourceMatch && actionMatch
  }

  // Check permission conditions
  private async checkConditions(conditions: any, userId: string, context?: any): Promise<boolean> {
    if (conditions.owner && context?.ownerId) {
      return context.ownerId === userId
    }

    if (conditions.tier && context?.requiredTier) {
      const { data: user } = await this.supabase.from("users").select("tier").eq("id", Number.parseInt(userId)).single()

      if (!user) return false

      const tierLevels = {
        grassroot: 1,
        pioneer: 2,
        elder: 3,
        blood_brotherhood: 4,
      }

      const userLevel = tierLevels[user.tier as keyof typeof tierLevels] || 0
      const requiredLevel = tierLevels[context.requiredTier as keyof typeof tierLevels] || 0

      return userLevel >= requiredLevel
    }

    return true
  }

  // Middleware for API route protection
  async requirePermission(userId: string, resource: string, action: string, context?: any) {
    const hasPermission = await this.hasPermission(userId, resource, action, context)

    if (!hasPermission) {
      await auditLogger.log({
        action: "PERMISSION_DENIED",
        userId,
        resource,
        metadata: {
          requiredAction: action,
          context,
        },
        severity: "high",
      })

      throw new Error(`Insufficient permissions for ${action} on ${resource}`)
    }
  }

  // Grant custom permission to user
  async grantPermission(userId: string, permission: string, grantedBy: string, expiresAt?: Date) {
    const { error } = await this.supabase.from("user_permissions").insert({
      user_id: Number.parseInt(userId),
      permission,
      granted_by: Number.parseInt(grantedBy),
      expires_at: expiresAt?.toISOString(),
      is_active: true,
      granted_at: new Date().toISOString(),
    })

    if (error) throw error

    await auditLogger.log({
      action: "PERMISSION_GRANTED",
      userId: grantedBy,
      metadata: {
        targetUserId: userId,
        permission,
        expiresAt: expiresAt?.toISOString(),
      },
      severity: "medium",
    })
  }

  // Revoke permission from user
  async revokePermission(userId: string, permission: string, revokedBy: string) {
    const { error } = await this.supabase
      .from("user_permissions")
      .update({ is_active: false })
      .eq("user_id", Number.parseInt(userId))
      .eq("permission", permission)

    if (error) throw error

    await auditLogger.log({
      action: "PERMISSION_REVOKED",
      userId: revokedBy,
      metadata: {
        targetUserId: userId,
        permission,
      },
      severity: "medium",
    })
  }
}

export const authorizationService = new AuthorizationService()
