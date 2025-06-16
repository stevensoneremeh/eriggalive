#!/bin/bash

echo "🚀 Setting up Erigga Fan Platform for Production..."

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Environment variable $1 is not set"
        return 1
    else
        echo "✅ $1 is configured"
        return 0
    fi
}

echo "📋 Checking environment variables..."

# Critical environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

OPTIONAL_VARS=(
    "JWT_SECRET"
    "PAYSTACK_SECRET_KEY"
    "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
)

# Check required variables
all_required_set=true
for var in "${REQUIRED_VARS[@]}"; do
    if ! check_env_var "$var"; then
        all_required_set=false
    fi
done

# Check optional variables
echo ""
echo "📋 Checking optional environment variables..."
for var in "${OPTIONAL_VARS[@]}"; do
    check_env_var "$var" || echo "⚠️  $var not set (will use defaults)"
done

if [ "$all_required_set" = false ]; then
    echo ""
    echo "❌ Some required environment variables are missing."
    echo "Please set them in your .env.local file or deployment environment."
    echo ""
    echo "Example .env.local:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "JWT_SECRET=your-jwt-secret-minimum-32-characters"
    echo ""
    exit 1
fi

echo ""
echo "✅ All required environment variables are configured!"

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    echo "🔐 Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
    echo "Generated JWT_SECRET: $JWT_SECRET"
    echo "Please add this to your environment variables:"
    echo "JWT_SECRET=$JWT_SECRET"
fi

echo ""
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🧪 Running health checks..."
node scripts/health-check.js

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "🚀 Your Erigga Fan Platform is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy to your hosting platform (Vercel, Railway, etc.)"
echo "2. Set up your domain and SSL certificate"
echo "3. Configure your Supabase database"
echo "4. Test all functionality in production"
echo ""
