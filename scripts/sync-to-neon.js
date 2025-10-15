#!/usr/bin/env node

/**
 * Database Sync Script: Supabase (Primary) → Neon (Analytics)
 * 
 * This script syncs data from Supabase to Neon for analytics and read-heavy operations.
 * Run this script periodically (via cron or Edge Function) to keep Neon in sync.
 * 
 * IMPORTANT: This is a simplified example. For production, consider:
 * - Using Airbyte, Fivetran, or Debezium for real-time CDC
 * - Implementing incremental syncs based on timestamps
 * - Adding error handling and retry logic
 * - Setting up monitoring and alerts
 * 
 * Usage:
 *   node scripts/sync-to-neon.js
 * 
 * Environment Variables Required:
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEON_DB_URL
 */

const { createClient } = require('@supabase/supabase-js')
const { neon } = require('@neondatabase/serverless')

// Configuration
const SYNC_TABLES = [
  'users',
  'events',
  'tickets',
  'coin_transactions',
  'withdrawals',
  'live_streams',
  'vault_items',
  'community_posts',
  'videos'
]

const BATCH_SIZE = 1000

async function syncTable(supabase, neonSql, tableName) {
  console.log(`\n📊 Syncing table: ${tableName}`)
  
  try {
    // Fetch all data from Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(BATCH_SIZE)

    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log(`✅ ${tableName}: No data to sync`)
      return
    }

    console.log(`  Found ${data.length} records`)

    // Truncate and insert (simple approach)
    // For production, use UPSERT with conflict resolution
    await neonSql`TRUNCATE TABLE ${neonSql(tableName)} CASCADE`
    
    // Batch insert to Neon
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      
      // Build column list
      const columns = Object.keys(batch[0])
      const values = batch.map(row => `(${columns.map(col => {
        const value = row[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
        return value
      }).join(',')})`)

      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(',')})
        VALUES ${values.join(',')}
        ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
      `

      await neonSql(insertQuery)
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}`)
    }

    console.log(`✅ ${tableName}: Synced successfully`)
  } catch (error) {
    console.error(`❌ Error syncing ${tableName}:`, error.message)
  }
}

async function syncIncrementalTable(supabase, neonSql, tableName, lastSyncTime) {
  console.log(`\n🔄 Incremental sync for: ${tableName}`)
  
  try {
    // Fetch only updated records since last sync
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .gte('updated_at', lastSyncTime)
      .order('updated_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log(`✅ ${tableName}: No new updates`)
      return
    }

    console.log(`  Found ${data.length} updated records`)

    // Upsert to Neon
    for (const record of data) {
      const columns = Object.keys(record)
      const values = columns.map(col => {
        const value = record[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
        return value
      })

      await neonSql`
        INSERT INTO ${neonSql(tableName)} (${neonSql(columns.join(','))})
        VALUES (${values.join(',')})
        ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
      `
    }

    console.log(`✅ ${tableName}: Incremental sync complete`)
  } catch (error) {
    console.error(`❌ Error syncing ${tableName}:`, error.message)
  }
}

async function main() {
  console.log('🚀 Starting Supabase → Neon sync...\n')

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  if (!process.env.NEON_DB_URL) {
    console.error('❌ Missing Neon database URL')
    process.exit(1)
  }

  // Initialize clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const neonSql = neon(process.env.NEON_DB_URL)

  console.log('✅ Connected to Supabase and Neon')

  // Determine sync mode
  const syncMode = process.argv[2] || 'full'
  const lastSyncTime = process.argv[3] || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  if (syncMode === 'full') {
    // Full sync (truncate and reload)
    console.log('📦 Running FULL sync (truncate and reload)')
    for (const table of SYNC_TABLES) {
      await syncTable(supabase, neonSql, table)
    }
  } else if (syncMode === 'incremental') {
    // Incremental sync (only changed records)
    console.log(`🔄 Running INCREMENTAL sync (changes since ${lastSyncTime})`)
    for (const table of SYNC_TABLES) {
      await syncIncrementalTable(supabase, neonSql, table, lastSyncTime)
    }
  }

  console.log('\n✅ Sync complete!')
}

// Run the script
main().catch(error => {
  console.error('❌ Sync failed:', error)
  process.exit(1)
})
