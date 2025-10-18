
import { neon } from '@neondatabase/serverless'

// Use Supabase database URL as fallback if Neon URL is not configured
const getDatabaseUrl = () => {
  const neonUrl = process.env.NEON_DATABASE_URL
  const supabaseUrl = process.env.DATABASE_URL
  
  if (neonUrl && neonUrl.startsWith('postgresql://')) {
    return neonUrl
  }
  
  if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
    return supabaseUrl
  }
  
  throw new Error('No valid database URL found. Please set NEON_DATABASE_URL or DATABASE_URL')
}

let sqlInstance: ReturnType<typeof neon> | null = null

const getSql = () => {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl())
  }
  return sqlInstance
}

export async function getNeonStats() {
  try {
    const sql = getSql()
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE last_seen_at >= NOW() - INTERVAL '30 days') as active_users_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
      FROM users
    ` as any[]
    
    const revenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0) as monthly_revenue
      FROM coin_transactions 
      WHERE status = 'completed'
    ` as any[]
    
    const events = await sql`
      SELECT 
        COUNT(*) as upcoming_events 
      FROM events 
      WHERE status = 'upcoming'
    ` as any[]
    
    const streams = await sql`
      SELECT COUNT(*) as active_streams 
      FROM live_streams 
      WHERE status = 'active'
    ` as any[]
    
    const withdrawals = await sql`
      SELECT 
        COUNT(*) as pending_withdrawals,
        COALESCE(SUM(amount_naira), 0) as pending_withdrawal_amount
      FROM withdrawals 
      WHERE status = 'pending'
    ` as any[]

    return {
      total_users: Number(stats[0]?.total_users) || 0,
      active_users_30d: Number(stats[0]?.active_users_30d) || 0,
      new_users_30d: Number(stats[0]?.new_users_30d) || 0,
      total_revenue: Number(revenue[0]?.total_revenue) || 0,
      monthly_revenue: Number(revenue[0]?.monthly_revenue) || 0,
      upcoming_events: Number(events[0]?.upcoming_events) || 0,
      active_streams: Number(streams[0]?.active_streams) || 0,
      pending_withdrawals: Number(withdrawals[0]?.pending_withdrawals) || 0,
      pending_withdrawal_amount: Number(withdrawals[0]?.pending_withdrawal_amount) || 0,
      last_updated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Neon stats error:', error)
    throw error
  }
}
