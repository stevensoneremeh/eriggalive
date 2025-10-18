import { db } from './client'
import { sql } from 'drizzle-orm'

export async function getDashboardStats() {
  try {
    const stats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM users WHERE tier = 'enterprise') as enterprise_users,
        (SELECT COUNT(*) FROM users WHERE tier = 'pro') as pro_users,
        (SELECT COUNT(*) FROM users WHERE tier = 'free') as free_users,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals
    `)
    
    return (stats as any[])[0] || {
      total_users: 0,
      enterprise_users: 0,
      pro_users: 0,
      free_users: 0,
      total_revenue: 0,
      pending_withdrawals: 0
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      total_users: 0,
      enterprise_users: 0,
      pro_users: 0,
      free_users: 0,
      total_revenue: 0,
      pending_withdrawals: 0
    }
  }
}

export async function getUsers(limit = 50, offset = 0) {
  try {
    const users = await db.execute(sql`
      SELECT 
        id, username, full_name, email, tier, role, 
        coins, is_active, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `)
    
    return users as any[]
  } catch (error) {
    console.error('Get users error:', error)
    return []
  }
}

export async function getHomepageContent() {
  try {
    const content = await db.execute(sql`
      SELECT * FROM homepage 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `)
    
    return content as any[]
  } catch (error) {
    console.error('Get homepage content error:', error)
    return []
  }
}

export async function getMerchProducts() {
  try {
    const products = await db.execute(sql`
      SELECT * FROM merch 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `)
    
    return products as any[]
  } catch (error) {
    console.error('Get merch products error:', error)
    return []
  }
}

export async function getVaultItems() {
  try {
    const items = await db.execute(sql`
      SELECT * FROM vault_items 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `)
    
    return items as any[]
  } catch (error) {
    console.error('Get vault items error:', error)
    return []
  }
}

export async function getVideos() {
  try {
    const videos = await db.execute(sql`
      SELECT * FROM videos 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `)
    
    return videos as any[]
  } catch (error) {
    console.error('Get videos error:', error)
    return []
  }
}

export async function getEvents() {
  try {
    const events = await db.execute(sql`
      SELECT * FROM events 
      ORDER BY event_date DESC
    `)
    
    return events as any[]
  } catch (error) {
    console.error('Get events error:', error)
    return []
  }
}

export async function getLiveStreams() {
  try {
    const streams = await db.execute(sql`
      SELECT * FROM live_streams 
      ORDER BY created_at DESC
    `)
    
    return streams as any[]
  } catch (error) {
    console.error('Get live streams error:', error)
    return []
  }
}
