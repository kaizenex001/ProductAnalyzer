#!/bin/bash

# Product Analyzer Deployment Script
# This script helps deploy the Product Analyzer to Vercel

echo "🚀 Product Analyzer Deployment Script"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the project first
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the build errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check for required environment variables
echo "🔍 Checking environment variables..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not found in environment."
    echo "   You'll need to set this in Vercel dashboard after deployment."
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Test your deployed application"
echo "3. Set up custom domain (optional)"
echo ""
echo "💡 Don't forget to add these environment variables in Vercel:"
echo "   - OPENAI_API_KEY (required)"
echo "   - NODE_ENV=production"
echo "   - SUPABASE_URL (if using Supabase)"
echo "   - SUPABASE_ANON_KEY (if using Supabase)"
