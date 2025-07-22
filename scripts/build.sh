#!/bin/bash

# Build script for deployment
echo "🚀 Starting build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Type check
echo "🔍 Running type check..."
pnpm run type-check

# Build the application
echo "🏗️ Building application..."
pnpm run build

echo "✅ Build completed successfully!"
