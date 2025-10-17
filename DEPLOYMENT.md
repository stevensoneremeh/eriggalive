# Deployment Guide

This guide covers deploying EriggaLive to production with all features properly configured.

## Pre-Deployment Checklist

### Environment Setup
- [ ] Supabase project created and configured
- [ ] Paystack account set up with API keys
- [ ] Domain name registered (if using custom domain)
- [ ] SSL certificate ready
- [ ] Environment variables documented

### Database Preparation
- [ ] All migrations applied to production database
- [ ] RLS policies enabled and tested
- [ ] Storage buckets created with proper permissions
- [ ] Admin users created with correct roles
- [ ] Test data cleaned from production database

### Code Preparation
- [ ] All features tested locally
- [ ] Build process completes without errors
- [ ] Environment variables validated
- [ ] Security audit completed
- [ ] Performance optimization applied

## Vercel Deployment

### Step 1: Project Setup
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel
\`\`\`

### Step 2: Environment Variables
Configure in Vercel Dashboard under Project Settings > Environment Variables:

**Production Variables:**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
\`\`\`

### Step 3: Deploy
\`\`\`bash
# Deploy to production
vercel --prod

# Verify deployment
curl -I https://your-deployment-url.vercel.app
\`\`\`

## Post-Deployment Configuration

### Paystack Webhook Setup
1. Login to Paystack Dashboard
2. Navigate to Settings > Webhooks
3. Add webhook URL: `https://yourdomain.com/api/paystack-webhook`
4. Select events: `charge.success`, `transfer.success`
5. Test webhook with sample payload

### Supabase Configuration
1. Update allowed origins in Supabase Dashboard
2. Configure email templates for production
3. Set up database backups
4. Enable real-time subscriptions if needed

### Domain Configuration (Optional)
1. Add custom domain in Vercel Dashboard
2. Configure DNS records
3. Verify SSL certificate
4. Update environment variables with new domain

## Monitoring Setup

### Performance Monitoring
\`\`\`javascript
// Add to next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
  // Enable Vercel Analytics
  analytics: {
    id: 'your-analytics-id',
  },
}
\`\`\`

### Error Tracking
\`\`\`javascript
// Add error boundary for production
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
\`\`\`

## Security Hardening

### Headers Configuration
\`\`\`javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
\`\`\`

### Rate Limiting
\`\`\`javascript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const limit = 100 // requests per minute
  const windowMs = 60 * 1000 // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      lastReset: Date.now(),
    })
  }

  const ipData = rateLimitMap.get(ip)

  if (Date.now() - ipData.lastReset > windowMs) {
    ipData.count = 0
    ipData.lastReset = Date.now()
  }

  if (ipData.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  ipData.count += 1

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
\`\`\`

## Backup and Recovery

### Database Backup
\`\`\`sql
-- Set up automated backups in Supabase
-- Enable Point-in-Time Recovery (PITR)
-- Configure backup retention policy
\`\`\`

### File Storage Backup
\`\`\`javascript
// Backup script for Supabase Storage
const { createClient } = require('@supabase/supabase-js')

async function backupStorage() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: files } = await supabase.storage
    .from('media')
    .list()

  // Implement backup logic
  console.log(`Backing up ${files.length} files`)
}
\`\`\`

## Troubleshooting

### Common Issues

**Webhook Not Receiving Events**
- Verify webhook URL is accessible
- Check Paystack dashboard for delivery attempts
- Validate signature verification logic

**Theme Not Persisting**
- Check localStorage permissions
- Verify next-themes configuration
- Test across different browsers

**Admin Access Denied**
- Verify user role in database
- Check RLS policies
- Confirm authentication state

**Mobile Layout Issues**
- Test on actual devices
- Verify viewport meta tag
- Check responsive breakpoints

### Debug Commands
\`\`\`bash
# Check deployment logs
vercel logs your-deployment-url

# Test webhook locally
curl -X POST http://localhost:3000/api/paystack-webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{"event":"charge.success","data":{"reference":"test","amount":50000,"status":"success","customer":{"email":"test@example.com"}}}'

# Verify database connection
npx supabase status
\`\`\`

## Performance Optimization

### Image Optimization
\`\`\`javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
}
\`\`\`

### Bundle Analysis
\`\`\`bash
# Analyze bundle size
npm run build
npm run analyze
\`\`\`

### Caching Strategy
\`\`\`javascript
// Set up proper caching headers
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
\`\`\`

---

For additional support, refer to the main README.md or create an issue in the repository.
