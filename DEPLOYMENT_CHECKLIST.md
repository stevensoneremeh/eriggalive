# EriggaLive Optimization - Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Code Review Complete
- [x] All critical issues fixed
- [x] Architect review passed
- [x] Multi-admin authorization working
- [x] Materialized views with unique indexes
- [x] Defensive error handling implemented
- [x] Documentation accurate and honest

### 2. Database Migrations Ready
- [ ] `supabase/migrations/2000_performance_optimization.sql` - Initial optimization
- [ ] `supabase/migrations/2001_fix_materialized_views.sql` - Fixed views

## 📋 Deployment Steps

### Step 1: Apply Database Migrations

#### Option A: Using Supabase CLI (Recommended)
```bash
# Review migrations
supabase db diff

# Apply migrations
supabase db push

# Verify materialized views created
supabase db execute "SELECT * FROM admin_dashboard_stats;"
supabase db execute "SELECT * FROM user_activity_summary LIMIT 5;"
supabase db execute "SELECT * FROM withdrawal_summary LIMIT 5;"
```

#### Option B: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run `2000_performance_optimization.sql`
3. Copy and run `2001_fix_materialized_views.sql`
4. Verify:
```sql
SELECT * FROM admin_dashboard_stats;
SELECT COUNT(*) FROM user_activity_summary;
SELECT COUNT(*) FROM withdrawal_summary;
```

### Step 2: Deploy Code Changes

#### If using Vercel/Next.js:
```bash
# Build and test locally
npm run build
npm run start

# Deploy
git add .
git commit -m "feat: database optimization and wallet control center"
git push origin main

# Vercel will auto-deploy
```

#### If using Replit:
- Changes are already live in development
- Click "Publish" to deploy to production
- Or use deployment API if configured

### Step 3: Verify Deployment

#### 3.1 Test Admin Access (Multiple Users)
- [ ] Login as `info@eriggalive.com` → Should have admin access
- [ ] Login as user with `role='admin'` → Should have admin access
- [ ] Login as user with `tier='enterprise'` → Should have admin access
- [ ] Login as regular user → Should be denied admin access

#### 3.2 Test Optimized Stats Endpoint
```bash
# Should return cached stats (fast)
curl -X GET https://your-domain.com/api/admin/stats-optimized \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should refresh and return latest stats
curl -X POST https://your-domain.com/api/admin/stats-optimized \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3.3 Test Wallet Control Center
- [ ] Navigate to `/admin/wallet-control`
- [ ] Search for a user by ID
- [ ] View wallet details and transaction history
- [ ] Credit coins to wallet (test amount: 100)
- [ ] Verify transaction appears in history
- [ ] Check `admin_actions` table for audit log:
  ```sql
  SELECT * FROM admin_actions 
  WHERE action_type = 'wallet_adjustment' 
  ORDER BY created_at DESC 
  LIMIT 5;
  ```

### Step 4: Monitor Performance

#### 4.1 Supabase Egress Monitoring
1. Go to Supabase Dashboard → Settings → Usage
2. Note current egress usage (baseline)
3. Monitor for 24-48 hours
4. Compare before/after:
   - Expected: 40-70% reduction
   - Actual: ___________

#### 4.2 API Response Times
Monitor these endpoints for improved performance:
- `/api/admin/stats-optimized` - Should be < 100ms (cached)
- `/api/admin/wallet-management` - Should be < 500ms
- `/admin/dashboard` - Page load should be faster

#### 4.3 Database Performance
```sql
-- Check materialized view refresh times
SELECT 
  schemaname, 
  matviewname, 
  last_refresh 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Check index usage
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC 
LIMIT 10;
```

## 🔧 Post-Deployment Configuration

### Materialized View Refresh Schedule

The views auto-refresh when older than 5 minutes. To change the interval:

1. Edit `supabase/migrations/2001_fix_materialized_views.sql`
2. Find `INTERVAL '5 minutes'`
3. Change to desired interval (e.g., `INTERVAL '10 minutes'`)
4. Re-run migration or update function directly:
```sql
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (...) AS $$
DECLARE
  stats_age INTERVAL;
BEGIN
  -- Check age of cached stats
  SELECT NOW() - admin_dashboard_stats.last_updated INTO stats_age
  FROM admin_dashboard_stats
  WHERE id = 1;
  
  -- Change this interval as needed
  IF NOT FOUND OR stats_age > INTERVAL '10 minutes' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  END IF;
  ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🚨 Rollback Plan

If issues occur after deployment:

### Option 1: Rollback Code Only
```bash
git revert HEAD
git push origin main
```

### Option 2: Rollback Migrations
```sql
-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_activity_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS withdrawal_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS refresh_admin_stats();

-- Keep the indexes (they help performance regardless)
```

### Option 3: Disable New Endpoints Temporarily
Update API routes to return old responses:
```typescript
// In stats-optimized/route.ts
export async function GET() {
  // Temporarily redirect to old endpoint
  return NextResponse.redirect('/api/admin/dashboard-stats')
}
```

## 📊 Success Metrics

Track these metrics to verify optimization success:

### Week 1:
- [ ] Supabase egress reduced by ___% (target: 40-70%)
- [ ] Admin dashboard load time: ___ ms (target: < 1s)
- [ ] No admin access issues reported
- [ ] All wallet adjustments properly logged

### Week 2:
- [ ] Materialized views refreshing correctly
- [ ] No database performance degradation
- [ ] Admin team comfortable with wallet control
- [ ] Cost savings visible in Supabase billing

### Month 1:
- [ ] Estimated monthly savings: ₦________
- [ ] Zero security incidents
- [ ] Admin satisfaction with new features
- [ ] System stability maintained

## 📞 Support Resources

### Documentation
- `OPTIMIZATION_SUMMARY.md` - Complete overview of changes
- `FIXES_APPLIED.md` - Details of all fixes
- `DEPLOYMENT_CHECKLIST.md` - This file

### Monitoring
- Supabase Dashboard: https://app.supabase.com/project/YOUR_PROJECT
- Application Logs: Check your hosting provider
- Database Logs: Supabase → Logs → Postgres

### Contacts
- Database Issues: Check Supabase support
- Code Issues: Review git history and architect feedback
- Admin Training: Use `OPTIMIZATION_SUMMARY.md` as guide

## ✅ Final Verification

Before marking deployment complete:
- [ ] All migrations applied successfully
- [ ] Multi-admin authorization working
- [ ] Wallet control center functional
- [ ] Materialized views refreshing
- [ ] Audit trail logging correctly
- [ ] No errors in application logs
- [ ] Egress monitoring started
- [ ] Team trained on new features

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production URL**: _____________
**Supabase Project**: _____________
