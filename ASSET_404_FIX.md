# Fixing 404 Errors for Assets on Vercel

## The Problem
You're seeing `Failed to load resource: the server responded with a status of 404` errors for assets like:
- `/assets/index-1lGOIt_T.js`
- `/assets/index-CW0ZwEcn.css`

## Root Causes

### 1. Build Not Completing Successfully
The most common cause is that the build is failing or not uploading assets correctly.

**Check:**
- Go to Vercel Dashboard → Your Project → Latest Deployment → Build Logs
- Look for any errors during the build process
- Verify that the build completes successfully

### 2. Output Directory Mismatch
Vercel might be looking in the wrong directory for built files.

**Verify in Vercel Dashboard:**
- Project Settings → General
- **Output Directory**: Should be `dist`
- **Build Command**: Should be `npm run build`

### 3. Assets Not Being Uploaded
Sometimes Vercel doesn't upload all files from the dist folder.

**Solution:**
1. Check if `dist/assets/` folder exists after local build
2. Verify file sizes aren't too large (Vercel has limits)
3. Try a fresh deployment

## Solutions

### Solution 1: Verify Build Locally

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build

# Check if assets exist
ls -la dist/assets/
```

If assets exist locally but not on Vercel, it's a deployment issue.

### Solution 2: Check Vercel Build Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Click on the latest deployment
4. Check the **Build Logs** tab
5. Look for:
   - Build completion message
   - Any errors about missing files
   - File upload errors

### Solution 3: Verify Vercel Project Settings

In Vercel Dashboard → Project Settings → General:

- ✅ **Framework Preset**: "Other" or "Vite"
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Install Command**: `npm install` (or leave empty)
- ✅ **Root Directory**: Leave empty (or set to `/` if needed)

### Solution 4: Force Rebuild

1. In Vercel Dashboard, go to your project
2. Click on **Deployments**
3. Click the three dots on the latest deployment
4. Select **Redeploy**
5. Or push a new commit to trigger a rebuild

### Solution 5: Check File Paths in Built HTML

The built `dist/index.html` should reference assets like:
```html
<script type="module" crossorigin src="/assets/index-1lGOIt_T.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CW0ZwEcn.css">
```

If paths are wrong (e.g., `./assets/` instead of `/assets/`), that's the issue.

### Solution 6: Add Base Path (If Needed)

If your app is deployed to a subdirectory (e.g., `https://domain.com/app/`), you need to set a base path in `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/app/', // Only if deployed to subdirectory
  // ... rest of config
});
```

**For root domain deployment, don't set base path.**

### Solution 7: Check .vercelignore

Make sure you don't have a `.vercelignore` file that's excluding the `dist` folder or assets.

### Solution 8: Manual Deployment Test

Try deploying via CLI to see detailed output:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Check the output for any errors
```

## Quick Checklist

- [ ] Build succeeds locally (`npm run build`)
- [ ] `dist/assets/` folder exists with files
- [ ] `dist/index.html` references assets correctly
- [ ] Vercel build logs show successful build
- [ ] Output directory is set to `dist` in Vercel
- [ ] No `.vercelignore` excluding dist folder
- [ ] File sizes are within Vercel limits

## Most Likely Fix

Based on the error, the most likely issue is:

1. **Build is failing silently** - Check Vercel build logs
2. **Output directory mismatch** - Verify it's set to `dist` in Vercel
3. **Assets not being uploaded** - Try redeploying

## Next Steps

1. **Check Vercel Build Logs** - This will tell you exactly what's wrong
2. **Verify local build works** - `npm run build` should create `dist/assets/`
3. **Redeploy** - Sometimes a fresh deployment fixes upload issues

If the build logs show the build completing but assets still 404, it's likely a Vercel platform issue - contact Vercel support with your deployment URL and build logs.

