# Product Analyzer Deployment Script for Windows PowerShell
# This script helps deploy the Product Analyzer to Vercel

Write-Host "🚀 Product Analyzer Deployment Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Build the project first
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix the build errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Check for required environment variables
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow

if (-not $env:OPENAI_API_KEY) {
    Write-Host "⚠️  OPENAI_API_KEY not found in environment." -ForegroundColor Yellow
    Write-Host "   You'll need to set this in Vercel dashboard after deployment." -ForegroundColor Yellow
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Test your deployed application" -ForegroundColor White
Write-Host "3. Set up custom domain (optional)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Don't forget to add these environment variables in Vercel:" -ForegroundColor Yellow
Write-Host "   - OPENAI_API_KEY (required)" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor White
Write-Host "   - SUPABASE_URL (if using Supabase)" -ForegroundColor White
Write-Host "   - SUPABASE_ANON_KEY (if using Supabase)" -ForegroundColor White
