# Quick Start Guide

Get Eduverse Dashboard up and running in minutes!

## Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ Python 3.11+ installed (`python3 --version`)
- ✅ npm or yarn installed
- ✅ Git installed

## 5-Minute Setup

### Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/eduverse-dashboard.git
cd eduverse-dashboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Step 2: Configure Environment (1 minute)

**Backend** - Create `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
```

**Frontend** - Create `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

> **Note**: For a full setup, you'll need API keys from:
> - Supabase (database)
> - Google Cloud (Gemini API)
> - See [README.md](../README.md) for complete setup

### Step 3: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m app.main
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 4: Access the Application (1 minute)

- 🌐 Frontend: http://localhost:5173
- 🔧 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

## What's Next?

1. **Set up Supabase**: Create a project and run migrations
   ```bash
   # See supabase/migrations/ for database schema
   ```

2. **Configure Google Cloud**: Set up service account
   ```bash
   # See backend/GOOGLE_CLOUD_AUTH_SETUP.md
   ```

3. **Explore Features**:
   - Try the AI Tutor at `/dashboard/student/ai-tutor`
   - Create content as a teacher
   - Explore the admin dashboard

## Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or use different port
npm run dev -- --port 3000
```

### Python Virtual Environment Issues

```bash
# Recreate virtual environment
rm -rf backend/venv
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Missing Dependencies

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
pip install --upgrade -r requirements.txt
```

## Need Help?

- Check the [main README](../README.md) for detailed setup
- Review [AI Features Documentation](./AI_FEATURES.md) for AI capabilities
- See [Deployment Guide](./DEPLOYMENT.md) for production setup
- Open an issue on GitHub for support

## Quick Test

Once running, test the API:

```bash
# Health check
curl http://localhost:8000/api/health

# Should return: {"status": "healthy"}
```

Happy coding! 🚀


