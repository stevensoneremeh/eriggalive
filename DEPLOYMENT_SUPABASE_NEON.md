# Supabase + Neon Dual Database Setup Guide

## Overview

EriggaLive uses a dual database architecture to optimize costs and performance:
- **Supabase (Primary)**: Handles writes, authentication, real-time features, and transactional data
- **Neon (Analytics)**: Handles heavy reads, analytics queries, and reporting to reduce Supabase egress costs

## Recent Build Fixes Applied

### 1. Edge Runtime Compatibility ✅
**Issue**: Middleware importing Supabase modules with Node.js APIs (`process.version`) incompatible with Edge Runtime

**Solution**:
- Created edge-safe middleware in `lib/supabase/middleware.ts`
- Uses direct REST API calls for auth verification instead of full Supabase SDK
- Removed imports of `@supabase/realtime-js` from edge context

**Files Modified**:
- `lib/supabase/middleware.ts` - Edge-safe Supabase auth

### 2. Dynamic Route Configuration ✅
**Issue**: Cookie-using API routes failing during static prerendering

**Solution**: 
- Added `export const dynamic = 'force-dynamic'`
- Added `export const runtime = 'nodejs'`

**Files Modified**:
- `app/api/me/balance/route.ts`
- `app/api/meet-greet/check-room/route.ts`

### 3. Component Import Fixes ✅
**Issue**: Missing imports in settings page (`useToast`, `Textarea`)

**Solution**: Added proper imports from shadcn/ui components

**Files Modified**:
- `app/settings/page.tsx`

## Environment Variables

### Required Variables

Create a `.env.local` file with the following:

```bash
# Supabase Configuration (Primary Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://kmafzzvdleprqhkeztsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_DB_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Neon Configuration (Analytics/Read-Heavy Database)
NEON_DB_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb

# Payment Gateway (Paystack)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

# Daily.co (Video Calls for Meet & Greet)
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your-domain.daily.co

# Mux (Live Streaming)
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret

# Application Settings
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

## Database Architecture

### Supabase (Primary DB)
**Use For**:
- All write operations (INSERT, UPDATE, DELETE)
- Authentication and user sessions
- Real-time subscriptions
- Row Level Security (RLS) enforcement
- Transactional operations

### Neon (Analytics DB)
**Use For**:
- Heavy read queries (admin dashboards, reports)
- Analytics and aggregations
- Content overviews
- User activity summaries
- Historical data queries

## Database Sync Strategy

### Initial Setup

1. **Create Neon Database**:
   ```bash
   # Create a Neon project at https://neon.tech
   # Get your connection string
   ```

2. **Replicate Schema**:
   ```bash
   # Export Supabase schema
   pg_dump -s $SUPABASE_DB_URL > schema.sql
   
   # Import to Neon
   psql $NEON_DB_URL < schema.sql
   ```

3. **Initial Data Sync**:
   ```bash
   # Run full sync
   node scripts/sync-to-neon.js full
   ```

### Ongoing Sync Options

#### Option 1: Scheduled Sync (Simple)
Run the sync script periodically via cron:

```bash
# Add to crontab (every hour)
0 * * * * cd /path/to/project && node scripts/sync-to-neon.js incremental "$(date -u -d '1 hour ago' --iso-8601=seconds)"
```

#### Option 2: Airbyte/Fivetran (Recommended for Production)
- Set up Airbyte Cloud or self-hosted
- Configure Supabase as source
- Configure Neon as destination
- Schedule sync frequency (5-15 minutes recommended)

#### Option 3: Custom Edge Function
```javascript
// Supabase Edge Function for real-time sync
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { neon } from '@neondatabase/serverless'

serve(async (req) => {
  const { table, record } = await req.json()
  const sql = neon(Deno.env.get('NEON_DB_URL'))
  
  // Upsert to Neon
  await sql`INSERT INTO ${table} ... ON CONFLICT ... DO UPDATE ...`
  
  return new Response('Synced')
})
```

## Database Client Usage

### Reading from Neon (Analytics)

```typescript
import { getAdminDashboardStats } from '@/lib/db'

// Automatically routes to Neon if configured
const stats = await getAdminDashboardStats()
```

### Writing to Supabase (Primary)

```typescript
import { getPrimaryDb } from '@/lib/db'

const supabase = getPrimaryDb()
await supabase.from('users').insert({ ... })
```

## API Routes Best Practices

### For Read-Heavy Routes

```typescript
// app/api/admin/stats/route.ts
import { getAdminDashboardStats } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Reads from Neon automatically
  const stats = await getAdminDashboardStats()
  return Response.json(stats)
}
```

### For Write Operations

```typescript
// app/api/users/update/route.ts
import { getPrimaryDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = getPrimaryDb()
  const { data, error } = await supabase
    .from('users')
    .update({ ... })
  
  return Response.json({ data, error })
}
```

## Monitoring and Optimization

### Cost Monitoring

1. **Supabase Dashboard**:
   - Monitor egress usage
   - Set up billing alerts
   - Review query performance

2. **Neon Dashboard**:
   - Monitor compute usage
   - Check storage growth
   - Review connection pooling

### Performance Tips

1. **Use Materialized Views** (already configured):
   ```sql
   -- Refresh materialized views periodically
   REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
   ```

2. **Index Heavy Read Columns**:
   ```sql
   CREATE INDEX idx_users_last_seen ON users(last_seen_at DESC);
   CREATE INDEX idx_transactions_status ON coin_transactions(status, created_at);
   ```

3. **Connection Pooling**:
   - Neon automatically provides connection pooling
   - Configure max connections in `lib/db/index.ts`

## Migration Steps

### From Single DB to Dual DB

1. **Setup Neon**: Create Neon project and get connection string
2. **Update Env**: Add `NEON_DB_URL` to environment variables
3. **Sync Schema**: Run `pg_dump` and import to Neon
4. **Initial Data Sync**: Run `node scripts/sync-to-neon.js full`
5. **Setup Scheduled Sync**: Configure cron or Airbyte
6. **Monitor**: Check logs and verify data consistency

### Rollback Plan

If Neon has issues, the system automatically falls back to Supabase:

```typescript
// In lib/db/index.ts
export function getAnalyticsDb() {
  const neonDbUrl = process.env.NEON_DB_URL
  
  if (!neonDbUrl) {
    console.warn("NEON_DB_URL not configured, falling back to Supabase")
    return null  // Functions will use Supabase instead
  }
  
  return neon(neonDbUrl)
}
```

## Security Considerations

### RLS Policies
- Supabase enforces RLS for all public access
- Neon should only be accessed server-side
- Never expose Neon credentials to client

### API Security
- All Neon queries run server-side only
- Service role key stored securely
- Admin endpoints require authentication

### Data Sync Security
- Sync scripts use service role key
- Scheduled tasks run in secure environment
- Airbyte connections use encrypted tunnels

## Troubleshooting

### Build Errors

1. **Edge Runtime Error**:
   ```
   Error: A Node.js API is used (process.version) which is not supported in the Edge Runtime
   ```
   **Solution**: Middleware is now edge-safe. Ensure no direct Supabase imports in middleware.

2. **Dynamic Server Usage**:
   ```
   Error: Dynamic server usage: cookies
   ```
   **Solution**: Add `export const dynamic = 'force-dynamic'` to route file.

### Sync Issues

1. **Data Mismatch**:
   - Run full sync: `node scripts/sync-to-neon.js full`
   - Check sync logs for errors
   - Verify schema compatibility

2. **Connection Errors**:
   - Verify `NEON_DB_URL` is correct
   - Check Neon project is active
   - Ensure IP whitelist includes server

## Manual Actions Required

### After Deployment

- [ ] Run initial database sync to Neon
- [ ] Set up scheduled sync (cron or Airbyte)
- [ ] Configure Neon extensions (if needed: `postgis`, `pg_stat_statements`)
- [ ] Test fallback behavior (disable Neon temporarily)
- [ ] Monitor egress costs on both platforms
- [ ] Set up alerts for sync failures
- [ ] Verify RLS policies are enforced on Supabase
- [ ] Test admin dashboard with Neon queries
- [ ] Validate API response times

### Production Checklist

- [ ] All environment variables configured
- [ ] Database sync running (verify with logs)
- [ ] Materialized views refreshing (check timestamps)
- [ ] Monitoring dashboards set up
- [ ] Backup strategy implemented
- [ ] Incident response plan documented
- [ ] Cost optimization reviewed monthly

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Edge Runtime**: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
- **Airbyte Setup**: https://airbyte.com/docs

## Contact

For issues specific to this deployment:
- Check logs: `pnpm run build` output
- Review error traces in Vercel dashboard
- Contact devops team for database access issues
