# Deploy Product Analyzer to Vercel

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Have a Vercel account
3. Required API keys ready

## Environment Variables Required

### OpenAI Configuration
- `OPENAI_API_KEY`: Your OpenAI API key

### Supabase Configuration (if using)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Server Configuration
- `NODE_ENV`: Set to `production`
- `CORS_ORIGIN`: Your deployed frontend URL (will be set automatically by Vercel)

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Choose your account
- Link to existing project? **No** (for first deployment)
- What's your project's name? `product-analyzer` (or your preferred name)
- In which directory is your code located? `./` (current directory)

### 3. Set Environment Variables
After deployment, go to your Vercel dashboard:

1. Navigate to your project
2. Go to Settings → Environment Variables
3. Add the following variables:

**Required:**
- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: `production`

**Optional (if using Supabase):**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 4. Redeploy with Environment Variables
```bash
vercel --prod
```

## Build Configuration

The project is configured with:
- **Frontend**: React + Vite build (`npm run build`)
- **Backend**: Serverless functions in `/api`
- **Static Files**: Served from `/client/dist`

## Verification

After deployment:
1. Visit your deployed URL
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Test the product analysis functionality

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure environment variables are set correctly

### API Errors
- Verify OpenAI API key is valid
- Check function logs in Vercel dashboard

### CORS Issues
- Frontend URL is automatically added to CORS origins
- Additional origins can be configured in `server/config.ts`

## Local Development

To run locally after Vercel setup:
```bash
npm run dev
```

## Production Commands

- **Deploy**: `vercel --prod`
- **View logs**: `vercel logs`
- **Environment variables**: `vercel env ls`

## File Structure for Vercel

```
ProductAnalyzer/
├── api/
│   └── index.js          # Serverless function entry point
├── client/
│   ├── dist/            # Built frontend (auto-generated)
│   └── src/             # Frontend source
├── server/              # Backend source
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to ignore during deployment
└── package.json         # Dependencies and scripts
```

## Next Steps

1. **Custom Domain**: Add a custom domain in Vercel dashboard
2. **Analytics**: Enable Vercel Analytics for usage insights
3. **Monitoring**: Set up error tracking and performance monitoring
4. **CI/CD**: Connect GitHub for automatic deployments
