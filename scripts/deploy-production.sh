#!/bin/bash

# ==============================================
# ERIGGA FAN PLATFORM - PRODUCTION DEPLOYMENT
# ==============================================

set -e

echo "🚀 Starting production deployment..."

# Check required environment variables
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
    "PAYSTACK_SECRET_KEY"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

# Run database seed
echo "🌱 Seeding database..."
npm run db:seed

# Run tests
echo "🧪 Running tests..."
npm run test:production

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Run post-deployment checks
echo "🔍 Running post-deployment checks..."
npm run health:check

echo "✅ Production deployment completed successfully!"
