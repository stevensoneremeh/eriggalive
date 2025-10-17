
# Troubleshooting Guide

## 503 Service Unavailable Errors

### Symptoms
- Repeated 503 errors on `/rest/v1/users` endpoint
- Admin dashboard shows "Error fetching admin stats"
- High request volume in logs

### Immediate Fix
1. Set environment variable:
   ```bash
   NEXT_PUBLIC_DISABLE_ADMIN_STATS=true
   ```
2. Restart the application
3. This will short-circuit admin stats fetching

### Long-term Fix
- Ensure caching is enabled (60s TTL on admin stats)
- Check rate limiting is active (50 req/min per IP)
- Verify retry logic has backoff and jitter
- Monitor cache hit ratio

## Profile Not Loading

### Symptoms
- User profile page shows no data
- 404 or 401 errors on profile fetch

### Solution
1. Check auth token is present and valid
2. Verify `users` table has `auth_user_id` column matching `auth.users.id`
3. Use canonical endpoint: `/api/user/profile`
4. Ensure RLS policies allow authenticated users to read their own profile

### Database Check
```sql
-- Verify mapping
SELECT 
  u.id as user_id,
  u.auth_user_id,
  au.id as auth_id
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id::text = au.id::text
WHERE au.id IS NULL
LIMIT 10;

-- Should return 0 rows; if not, there's a mapping issue
```

## Edge Runtime Errors

### Symptoms
- Build errors mentioning "Edge runtime"
- API routes fail with import errors

### Solution
1. Add to affected routes:
   ```typescript
   export const dynamic = 'force-dynamic'
   export const runtime = 'nodejs' // if cookies/Node APIs needed
   ```
2. Replace Node-only imports with Web APIs where possible
3. Move heavy processing to separate API routes marked as `nodejs` runtime

## Rate Limiting Issues

### Symptoms
- 429 Too Many Requests
- `X-RateLimit-Remaining: 0` header

### Solution
1. Check if legitimate traffic or abuse
2. Adjust limits in `lib/utils/rate-limiter.ts`:
   ```typescript
   export const adminRateLimiter = new RateLimiter(100, 60000) // 100 req/min
   ```
3. Consider implementing per-user limits instead of per-IP for authenticated routes

## Cache Not Working

### Symptoms
- Every request hits database
- Response times don't improve
- `cached: false` in responses

### Solution
1. Verify `serverCache` is imported correctly
2. Check TTL values are reasonable (30-60s for admin stats)
3. Ensure cache key is consistent across requests
4. Monitor memory usage (in-memory cache)

## Emergency Procedures

### Complete System Reset
```bash
# Stop all requests
export NEXT_PUBLIC_DISABLE_ADMIN_STATS=true

# Clear server cache
# (restart application or add cache.clear() endpoint)

# Reset rate limiters
# (restart application)

# Redeploy
git checkout main
pnpm install
pnpm build
```

### Database Recovery
```bash
# If profile/user mapping breaks
# DO NOT RUN WITHOUT BACKUP
# Review and run migration SQL to realign IDs
```
