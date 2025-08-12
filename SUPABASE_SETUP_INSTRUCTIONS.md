# Supabase Setup Instructions for EriggaLive

## Required Steps for Production Deployment

### 1. Database Schema Setup

**IMPORTANT:** Run this SQL script in your Supabase SQL Editor before testing signup:

\`\`\`sql
-- Copy and paste the entire content of scripts/36-production-database-schema.sql
-- This script will:
-- ✅ Create the unified users table
-- ✅ Set up automatic user creation triggers
-- ✅ Configure RLS policies
-- ✅ Create foreign key constraints
-- ✅ Add default community categories
\`\`\`

### 2. Environment Variables

Add these to your Vercel project settings:

**Required for Payments:**
\`\`\`
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
\`\`\`

**Required for Redirects:**
\`\`\`
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

### 3. Supabase Configuration

**Authentication Settings:**
- Go to Authentication > Settings
- Enable email confirmations (optional)
- Set Site URL to your production domain
- Add redirect URLs:
  - `https://your-domain.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (for development)

**Storage Setup:**
- Create a bucket named `eriggalive-assets`
- Enable public access for avatar uploads
- Set up RLS policies for the bucket

### 4. Testing the Complete Flow

**Free Tier Signup (Grassroot):**
1. Go to `/signup`
2. Fill in user details
3. Select "Grassroot" tier
4. Click "Create Free Account"
5. Should redirect to `/dashboard`

**Paid Tier Signup (Pioneer/Elder/Blood):**
1. Go to `/signup`
2. Fill in user details
3. Select paid tier (Pioneer: ₦2,500, Elder: ₦5,000, Blood: ₦10,000)
4. Click "Pay & Create Account"
5. Complete Paystack payment
6. Should redirect to `/dashboard` with tier assigned

**Enterprise Signup:**
1. Go to `/signup`
2. Fill in user details
3. Select "Enterprise" tier
4. Enter custom amount ($200+ USD)
5. Complete payment (converted to Naira)
6. Should redirect to `/dashboard` with enterprise tier

### 5. Verification Checklist

- [ ] Database schema script executed successfully
- [ ] Environment variables configured in Vercel
- [ ] Supabase auth settings updated
- [ ] Storage bucket created and configured
- [ ] Free signup works and redirects to dashboard
- [ ] Paid signup processes payment and creates account
- [ ] Enterprise signup accepts custom amounts
- [ ] Users can sign in after signup
- [ ] Dashboard displays user information correctly

### 6. Troubleshooting

**Common Issues:**

1. **"User creation trigger failed"**
   - Ensure the database schema script ran completely
   - Check Supabase logs for trigger errors

2. **"Payment verification failed"**
   - Verify Paystack keys are correct
   - Check that webhook URLs are configured

3. **"Redirect not working"**
   - Ensure NEXT_PUBLIC_SITE_URL is set correctly
   - Check auth callback route is accessible

4. **"Database connection failed"**
   - Verify Supabase environment variables
   - Check RLS policies are not blocking access

### 7. Production Deployment

Before going live:
- [ ] Replace test Paystack keys with live keys
- [ ] Update NEXT_PUBLIC_SITE_URL to production domain
- [ ] Test all signup flows in production environment
- [ ] Monitor Supabase logs for any errors
- [ ] Set up proper error tracking (Sentry, etc.)

### 8. Support

If you encounter issues:
1. Check the `/test-signup` page for system diagnostics
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Test individual components (auth, payment, database) separately
