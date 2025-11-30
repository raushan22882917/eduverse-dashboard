# Fixing Vercel 404 Error

## The Problem
You're seeing a `404: NOT_FOUND` error from Vercel. This is a Vercel platform error, not a standard web 404.

## Common Causes

1. **Build Output Not Found**: Vercel can't find the built files
2. **Incorrect Output Directory**: The build output isn't in the expected location
3. **Build Failing**: The build process is failing silently
4. **Framework Detection**: Vercel isn't detecting the framework correctly

## Solutions

### Solution 1: Check Build Logs in Vercel

1. Go to your Vercel project dashboard
2. Click on the latest deployment
3. Check the **Build Logs** tab
4. Look for any errors during the build process

### Solution 2: Verify Build Settings in Vercel Dashboard

1. Go to **Project Settings** > **General**
2. Verify:
   - **Framework Preset**: Should be "Other" or "Vite" (if available)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or leave empty)

### Solution 3: Manual Deployment via CLI

If the dashboard isn't working, try deploying via CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Solution 4: Check Environment Variables

Make sure all required environment variables are set in Vercel:

1. Go to **Project Settings** > **Environment Variables**
2. Add these variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (if needed)
   - `VITE_API_BASE_URL` (if needed)

### Solution 5: Test Build Locally First

Before deploying, test the build locally:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Check if dist folder exists and has index.html
ls -la dist/
```

### Solution 6: Simplified vercel.json

The `vercel.json` has been simplified. If you still get errors, try removing it entirely and let Vercel auto-detect:

```bash
# Temporarily rename it
mv vercel.json vercel.json.backup

# Deploy again
vercel --prod
```

### Solution 7: Check for Build Errors

Common build errors:
- Missing dependencies
- TypeScript errors
- Environment variable issues
- Node version mismatch (should be 18+)

## Quick Checklist

- [ ] Build succeeds locally (`npm run build`)
- [ ] `dist/index.html` exists after build
- [ ] Environment variables are set in Vercel
- [ ] Build command is `npm run build`
- [ ] Output directory is `dist`
- [ ] Node version is 18+ in Vercel settings

## If Still Not Working

1. **Check Vercel Build Logs**: Look for specific error messages
2. **Try a Fresh Deployment**: Delete and recreate the project
3. **Contact Vercel Support**: They can check server-side logs

## Updated Configuration

The `vercel.json` has been updated to a minimal configuration that should work with Vite. The key settings are:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing: All routes redirect to `/index.html`

