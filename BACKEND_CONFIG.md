# Backend Configuration Guide

This application supports multiple backend configurations for different development and deployment scenarios.

## Configuration Options

### 1. Remote Backend via Proxy (Default - Recommended for Development)

**Best for:** Development when you don't have a local backend running

```bash
# .env (default configuration)
# No VITE_API_BASE_URL or VITE_USE_LOCAL_BACKEND set
```

**How it works:**
- Frontend runs on `http://localhost:5173`
- API calls go to `/api/*` (relative paths)
- Vite proxy forwards requests to `https://classroom-backend-821372121985.us-central1.run.app`
- No CORS issues because proxy handles cross-origin requests

### 2. Local Backend

**Best for:** Full-stack development when you have the backend running locally

```bash
# .env.local or add to .env
VITE_USE_LOCAL_BACKEND="true"
```

**Requirements:**
- Backend server running on `http://localhost:8000`
- Backend must have CORS configured to allow `http://localhost:5173`

### 3. Direct Remote Backend

**Best for:** Production or when you want to test against remote backend directly

```bash
# .env
VITE_API_BASE_URL="https://classroom-backend-821372121985.us-central1.run.app/api"
```

**Note:** May encounter CORS issues in development

### 4. Custom Backend URL

**Best for:** Testing against different backend environments

```bash
# .env
VITE_API_BASE_URL="http://localhost:8000/api"
# or
VITE_API_BASE_URL="https://your-custom-backend.com/api"
```

## Quick Setup Commands

### For Remote Backend Development (Default)
```bash
npm run dev
# Uses proxy - no additional setup needed
```

### For Local Backend Development
```bash
# Option 1: Create .env.local file
echo 'VITE_USE_LOCAL_BACKEND="true"' > .env.local
npm run dev

# Option 2: Add to existing .env
echo 'VITE_USE_LOCAL_BACKEND="true"' >> .env
npm run dev
```

### For Production Build
```bash
npm run build
# Automatically uses production backend URL
```

## Environment File Priority

Vite loads environment files in this order (later files override earlier ones):

1. `.env`
2. `.env.local`
3. `.env.development` (in development)
4. `.env.production` (in production)
5. `.env.development.local` (in development)
6. `.env.production.local` (in production)

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Use proxy method (default) - set `VITE_USE_LOCAL_BACKEND="false"` or remove it
2. Or ensure your backend has proper CORS headers for `http://localhost:5173`

### Connection Refused
If you see "connection refused":
1. Check if your local backend is running on port 8000
2. Switch to remote backend: remove `VITE_USE_LOCAL_BACKEND` from .env

### API Not Found (404)
If you see 404 errors:
1. Check the backend URL is correct
2. Verify the API endpoints exist on the backend
3. Check network tab in browser dev tools for actual request URLs

## Current Configuration

The app will automatically detect and use:
- **Development:** Proxy to remote backend (no CORS issues)
- **Production:** Direct connection to remote backend
- **Local Backend:** When `VITE_USE_LOCAL_BACKEND="true"` is set

Check the browser console for logs showing which backend URL is being used.