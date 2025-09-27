
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        isSuperAdmin: false,
        isAdmin: false 
      }, { status: 401 })
    }

    // Check user permissions
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role, is_super_admin, email, full_name')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ 
        error: "User profile not found",
        isSuperAdmin: false,
        isAdmin: false 
      }, { status: 404 })
    }

    const isSuperAdmin = userProfile.role === 'super_admin' || userProfile.is_super_admin === true
    const isAdmin = ['super_admin', 'admin'].includes(userProfile.role) || isSuperAdmin
    const isInfoEmail = userProfile.email === 'info@eriggalive.com'

    // Log admin access
    if (isSuperAdmin) {
      await supabase.rpc('log_admin_action', {
        admin_id: userProfile.id,
        action: 'admin_dashboard_access',
        resource_type: 'admin_panel',
        resource_id: 'dashboard'
      })
    }

    return NextResponse.json({
      isSuperAdmin,
      isAdmin,
      isInfoEmail,
      canManageMeetGreet: isSuperAdmin || isInfoEmail,
      userInfo: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        role: userProfile.role
      }
    })

  } catch (error: any) {
    console.error("Super admin verification error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      isSuperAdmin: false,
      isAdmin: false 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { action, resourceType, resourceId, data } = body

    // Get current user and verify super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role, is_super_admin, email')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const isSuperAdmin = userProfile.role === 'super_admin' || userProfile.is_super_admin === true

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
    }

    // Log the admin action
    await supabase.rpc('log_admin_action', {
      admin_id: userProfile.id,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      new_values: data
    })

    return NextResponse.json({ success: true, message: "Admin action logged" })

  } catch (error: any) {
    console.error("Admin action logging error:", error)
    return NextResponse.json({ error: "Failed to log admin action" }, { status: 500 })
  }
}
