# Environment Setup Guide

This guide will help you set up the required environment variables for the Erigga Live platform.

## Required Environment Variables

### Supabase Configuration

You need to set up the following environment variables for Supabase integration:

\`\`\`bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role (Optional but recommended for production)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### Optional Configuration

\`\`\`bash
# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VERCEL_ENV=production

# Payment Integration (Optional)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Meet & Greet Configuration (Optional)
NEXT_PUBLIC_MEET_GREET_PHONE=your_phone_number

# Development Passwords (Development only)
ADMIN_PASSWORD=your_admin_password
MOD_PASSWORD=your_mod_password
GRASSROOT_PASSWORD=your_grassroot_password
PIONEER_PASSWORD=your_pioneer_password
ELDER_PASSWORD=your_elder_password
BLOOD_PASSWORD=your_blood_password
\`\`\`

## Setup Instructions

### 1. Local Development

Create a `.env.local` file in your project root:

\`\`\`bash
# Copy this template and fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

### 2. Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each environment variable with the appropriate values
4. Make sure to set the correct environment (Production, Preview, Development)

### 3. Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### Common Issues

1. **"Authentication service is not configured"**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Verify the values are correct (no extra spaces or quotes)
   - Restart your development server after adding environment variables

2. **"Supabase environment variables not configured"**
   - Ensure environment variables are prefixed with `NEXT_PUBLIC_` for client-side access
   - Check that your `.env.local` file is in the project root
   - Verify the file is not named `.env.local.txt` or similar

3. **Environment variables not loading**
   - Restart your development server (`npm run dev` or `yarn dev`)
   - Check that your `.env.local` file doesn't have syntax errors
   - Ensure there are no spaces around the `=` sign

### Validation

You can check if your environment is properly configured by looking at the browser console. The application will log the status of your environment variables.

## Security Notes

- Never commit `.env.local` or any file containing secrets to version control
- Add `.env.local` to your `.gitignore` file
- Use different keys for development and production environments
- Regularly rotate your API keys for security

## Database Setup

After setting up environment variables, you'll need to:

1. Run the database migration scripts in the `scripts/` folder
2. Set up Row Level Security policies
3. Create storage buckets for file uploads
4. Configure authentication settings in Supabase

Refer to the database setup scripts in the `scripts/` directory for detailed instructions.
