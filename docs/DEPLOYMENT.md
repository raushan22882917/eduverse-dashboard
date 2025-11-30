# Deployment Guide

This guide covers deploying Eduverse Dashboard to production environments.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Supabase project
- Domain name (optional)
- SSL certificates (for production)

## Backend Deployment

### Option 1: Google Cloud Run (Recommended)

1. **Build Docker Image**

   ```bash
   cd backend
   docker build -t gcr.io/YOUR_PROJECT_ID/eduverse-api:latest .
   ```

2. **Push to Container Registry**

   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/eduverse-api:latest
   ```

3. **Deploy to Cloud Run**

   ```bash
   gcloud run deploy eduverse-api \
     --image gcr.io/YOUR_PROJECT_ID/eduverse-api:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="SUPABASE_URL=...,GEMINI_API_KEY=..." \
     --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=service-account:latest"
   ```

4. **Configure Environment Variables**

   Set all required environment variables in Cloud Run:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GEMINI_API_KEY`
   - `WOLFRAM_APP_ID`
   - `YOUTUBE_API_KEY`
   - `PINECONE_API_KEY`
   - `GOOGLE_CLOUD_PROJECT`
   - `CORS_ORIGINS` (your frontend URL)

### Option 2: Docker Compose

1. **Create docker-compose.yml**

   ```yaml
   version: '3.8'
   services:
     api:
       build: ./backend
       ports:
         - "8000:8000"
       environment:
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_KEY=${SUPABASE_KEY}
         # ... other env vars
       volumes:
         - ./backend/service-account.json:/app/service-account.json
   ```

2. **Deploy**

   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server

1. **Setup Server**

   ```bash
   # Install Python 3.11+
   sudo apt update
   sudo apt install python3.11 python3.11-venv
   
   # Clone repository
   git clone https://github.com/yourusername/eduverse-dashboard.git
   cd eduverse-dashboard/backend
   
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Setup Systemd Service**

   Create `/etc/systemd/system/eduverse-api.service`:

   ```ini
   [Unit]
   Description=Eduverse API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/eduverse-dashboard/backend
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start Service**

   ```bash
   sudo systemctl enable eduverse-api
   sudo systemctl start eduverse-api
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Configure Environment Variables**

   In Vercel dashboard, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL)

### Option 2: Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Add in Netlify dashboard

### Option 3: Cloudflare Pages

1. **Connect Repository** to Cloudflare Pages
2. **Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Environment Variables**: Add in Pages dashboard

### Option 4: Static Hosting

1. **Build**

   ```bash
   npm run build
   ```

2. **Upload `dist/` directory** to your hosting provider:
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Any static hosting service

## Database Setup

### Supabase Migrations

**⚠️ IMPORTANT: Before deploying to production, ensure all migrations are applied to your Supabase database.**

1. **Using Supabase CLI (Recommended)**

   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link project
   supabase link --project-ref your-project-ref
   
   # Push all migrations
   supabase db push
   ```

2. **Using Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Run migration files from `supabase/migrations/` in chronological order:
     - Start with the earliest dated migration
     - Run each migration file sequentially
     - **Important**: Make sure to run `20251206_add_saved_explanations.sql` to fix the 404 NOT_FOUND error

3. **Quick Fix for 404 NOT_FOUND Error**

   If you're seeing `404: NOT_FOUND` errors after deployment, it's likely because the `saved_explanations` table is missing. To fix:

   ```bash
   # Option 1: Using Supabase CLI
   supabase db push
   
   # Option 2: Manual SQL
   # Copy the contents of supabase/migrations/20251206_add_saved_explanations.sql
   # and run it in Supabase SQL Editor
   ```

4. **Verify Migrations Applied**

   Check that all tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   You should see `saved_explanations` in the list.

## Environment Configuration

### Production Environment Variables

**Backend (.env):**
```env
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GEMINI_API_KEY=your-gemini-key

PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-environment

WOLFRAM_APP_ID=your-wolfram-id
YOUTUBE_API_KEY=your-youtube-key
```

**Frontend (.env.production):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.yourdomain.com
```

## SSL/HTTPS Setup

### Using Cloudflare

1. Add your domain to Cloudflare
2. Enable SSL/TLS (Full mode)
3. Configure DNS records

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring and Logging

### Google Cloud Monitoring

- Enable Cloud Monitoring for Cloud Run
- Set up alerts for errors and performance

### Application Logging

- Use structured logging
- Integrate with Cloud Logging
- Set up log aggregation

## Performance Optimization

1. **Enable CDN** for static assets
2. **Configure caching** headers
3. **Optimize images** and assets
4. **Enable compression** (gzip/brotli)
5. **Use database connection pooling**
6. **Implement rate limiting**

## Security Checklist

- [ ] All environment variables are set securely
- [ ] Service account keys are stored securely (not in code)
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] SSL/HTTPS is configured
- [ ] Database credentials are secure
- [ ] API keys are rotated regularly
- [ ] Error messages don't expose sensitive information

## Scaling

### Horizontal Scaling

- Cloud Run automatically scales based on traffic
- Configure min/max instances as needed

### Database Scaling

- Use Supabase connection pooling
- Monitor query performance
- Optimize slow queries

## Backup and Recovery

1. **Database Backups**
   - Supabase provides automatic backups
   - Configure additional backup schedule if needed

2. **Code Backups**
   - Use Git for version control
   - Tag releases for easy rollback

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGINS` environment variable
   - Ensure frontend URL is included

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity

3. **API Key Errors**
   - Verify all API keys are set correctly
   - Check API key permissions and quotas

## Support

For deployment issues, please:
1. Check logs in your hosting platform
2. Review error messages
3. Open an issue on GitHub with deployment details

