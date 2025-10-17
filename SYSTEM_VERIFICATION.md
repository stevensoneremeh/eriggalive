
# System Verification Steps

## Environment Setup

1. Ensure `.env.local` has the following:
```bash
NEXT_PUBLIC_DISABLE_ADMIN_STATS=false
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Build & Run Tests

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run dev server
pnpm dev
```

## Manual Verification (curl commands)

### 1. Test Profile Endpoint
```bash
# Get access token from browser (after login, check localStorage or cookies)
ACCESS_TOKEN="your_access_token_here"

# Test profile fetch
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://0.0.0.0:5000/api/user/profile

# Expected: 200 OK with profile JSON
```

### 2. Test Admin Stats (as admin)
```bash
# Get admin access token
ADMIN_TOKEN="admin_access_token_here"

# First call (cache miss)
curl -v -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://0.0.0.0:5000/api/admin/dashboard-stats

# Second call within 60s (cache hit - should be faster)
curl -v -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://0.0.0.0:5000/api/admin/dashboard-stats

# Expected: Both return 200, second has "cached: true" and X-RateLimit-Remaining header
```

### 3. Test Rate Limiting
```bash
# Rapid fire requests (should hit rate limit after 50)
for i in {1..60}; do
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://0.0.0.0:5000/api/admin/dashboard-stats
  echo "Request $i"
done

# Expected: After ~50 requests, receive 429 Too Many Requests
```

### 4. Test Disable Flag
```bash
# Set env var
export NEXT_PUBLIC_DISABLE_ADMIN_STATS=true

# Restart server and test
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://0.0.0.0:5000/api/admin/dashboard-stats

# Expected: 503 with message "Admin stats temporarily disabled"
```

## Rollback Plan

### Quick Disable (no redeploy)
1. Set `NEXT_PUBLIC_DISABLE_ADMIN_STATS=true` in environment
2. Restart application

### Full Rollback
```bash
# Revert to previous commit
git log --oneline -n 5
git revert <commit_hash>
git push

# Or reset hard (if not pushed)
git reset --hard HEAD~1
```

## Success Criteria

- ✅ Profile page loads in 1 request, no 503 errors
- ✅ Admin dashboard loads once, subsequent calls are cached
- ✅ No Edge runtime errors in build
- ✅ Rate limiting works (429 after threshold)
- ✅ Retry with backoff prevents request floods
- ✅ Disable flag short-circuits requests immediately
