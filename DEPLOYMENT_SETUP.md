# Deployment Setup Guide

## Quick Fix Summary

The deployment issues have been fixed:

1. ✅ **Supabase client now uses environment variables** - Updated `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. ✅ **Created deployment configuration files** - Added `vercel.json` and `netlify.toml`
3. ✅ **Environment variables documented** - See below for required variables

## Required Environment Variables

Before deploying, you need to set these environment variables in your hosting platform:

### For Frontend (Vite)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Note:** The Supabase client will fall back to hardcoded values if environment variables are not set (for backward compatibility), but you should always use environment variables in production.

## Deployment Instructions

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (optional, you can also use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   - Go to your project in Vercel dashboard
   - Navigate to **Settings** > **Environment Variables**
   - Add all the `VITE_*` variables listed above
   - Redeploy after adding variables

4. **The `vercel.json` file is already configured** with:
   - Build command: `npm run build`
   - Output directory: `dist`
   - SPA routing (all routes redirect to index.html)

### Option 2: Netlify

1. **Connect your repository** to Netlify

2. **Set Build Settings** (or use the `netlify.toml` file that's already created):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**:
   - Go to **Site Settings** > **Build & Deploy** > **Environment Variables**
   - Add all the `VITE_*` variables listed above

4. **Deploy** - Netlify will automatically deploy on git push

### Option 3: Cloudflare Pages

1. **Connect Repository** to Cloudflare Pages

2. **Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (or leave empty)

3. **Set Environment Variables**:
   - Go to **Settings** > **Environment Variables**
   - Add all the `VITE_*` variables listed above

4. **Custom Domain** (optional):
   - Add your custom domain in **Custom Domains** section

### Option 4: Static Hosting (AWS S3, Google Cloud Storage, etc.)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload the `dist/` directory** to your hosting provider

3. **Configure environment variables**:
   - Since these are build-time variables, you'll need to:
     - Create a `.env.production` file with your production values
     - Build with: `npm run build` (Vite will use `.env.production` automatically)
   - Or use your hosting provider's environment variable system if supported

## Troubleshooting

### Build Fails

1. **Check Node version**: Ensure you're using Node.js 18+:
   ```bash
   node --version
   ```

2. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Test build locally**:
   ```bash
   npm run build
   ```

### Environment Variables Not Working

1. **Verify variable names**: They must start with `VITE_` to be accessible in Vite
2. **Redeploy after adding variables**: Most platforms require a new deployment
3. **Check build logs**: Look for any errors related to missing variables

### Routing Issues (404 on refresh)

- **Vercel**: The `vercel.json` already includes the rewrite rule
- **Netlify**: The `netlify.toml` already includes the redirect rule
- **Cloudflare Pages**: Add a `_redirects` file in `public/` with:
  ```
  /*    /index.html   200
  ```

### Supabase Connection Issues

1. **Verify your Supabase URL and key** are correct
2. **Check CORS settings** in Supabase dashboard
3. **Ensure your Supabase project is active** and not paused

## Next Steps

1. ✅ Set environment variables in your hosting platform
2. ✅ Deploy using one of the methods above
3. ✅ Test the deployed application
4. ✅ Verify all features work correctly

## Additional Notes

- The Supabase client has been updated to use environment variables but maintains backward compatibility with hardcoded values
- All deployment configuration files are ready to use
- Make sure your backend API is also deployed and accessible from your frontend domain


