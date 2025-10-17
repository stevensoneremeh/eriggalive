# Environment Variables Setup

This document explains how to set up the required environment variables for the Erigga Live platform.

## Required Environment Variables

### Supabase Configuration
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
\`\`\`

### Authentication Passwords (for demo users)
\`\`\`bash
ADMIN_PASSWORD=your_admin_password
MOD_PASSWORD=your_mod_password
GRASSROOT_PASSWORD=your_grassroot_password
PIONEER_PASSWORD=your_pioneer_password
ELDER_PASSWORD=your_elder_password
BLOOD_PASSWORD=your_blood_password
\`\`\`

### Payment Integration (Optional)
\`\`\`bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
\`\`\`

### Application Configuration
\`\`\`bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VERCEL_ENV=production
NEXT_PUBLIC_MEET_GREET_PHONE=+1234567890
\`\`\`

## Setup Instructions

### 1. Local Development
Create a `.env.local` file in your project root:

\`\`\`bash
# Copy the template
cp .env.example .env.local

# Edit the file with your values
nano .env.local
\`\`\`

### 2. Vercel Deployment
Add environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with its corresponding value
4. Deploy your project

### 3. Supabase Setup
1. Create a new Supabase project
2. Go to Settings > API
3. Copy your project URL and anon key
4. Copy your service role key (keep this secret!)

## Demo Mode

If environment variables are missing, the application will automatically switch to demo mode with:

- Mock authentication
- Sample data
- Simulated API responses
- Local storage for state

This allows the application to run without a real Supabase backend for development and testing purposes.

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Ensure the URL starts with `https://`
   - Verify the keys are correct in your Supabase dashboard

2. **Authentication not working**
   - Verify your Supabase project is active
   - Check that RLS policies are properly configured
   - Ensure the service role key is correct

3. **Build failures**
   - Make sure all required environment variables are set in your deployment platform
   - Check that the Supabase project is accessible from your deployment environment

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase project status
3. Test with demo mode first
4. Contact support if problems persist

## Security Notes

- Never commit `.env.local` to version control
- Keep service role keys secure and never expose them to the client
- Use different keys for development and production
- Regularly rotate your API keys
