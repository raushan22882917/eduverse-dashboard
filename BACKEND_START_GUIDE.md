# Backend Server Start Guide

## Quick Start

The backend server needs to be running for the frontend to work. Here's how to start it:

### Option 1: Using the Startup Script (Recommended)

```bash
cd backend
./start_server.sh
```

### Option 2: Manual Start

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Using Python Module

```bash
cd backend
source venv/bin/activate
python -m app.main
```

## Verify Server is Running

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
```

## Check Server Health

Open in browser or use curl:
- Health Check: http://localhost:8000/api/health
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or use a different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Import Errors

If you see import errors:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Missing Environment Variables

Make sure `.env` file exists in the `backend` directory with:
- `GEMINI_API_KEY`
- `WOLFRAM_APP_ID`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- And other required variables

### Virtual Environment Issues

If virtual environment doesn't exist:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Frontend Configuration

Make sure your frontend `.env` file (or `vite.config.ts`) has:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Or the frontend will default to `http://localhost:8000/api`

## Common Issues

1. **ERR_CONNECTION_REFUSED**: Backend server is not running
   - Solution: Start the backend server using one of the methods above

2. **CORS Errors**: Backend CORS settings don't match frontend URL
   - Solution: Check `backend/app/config.py` CORS_ORIGINS setting

3. **Module Not Found**: Missing dependencies
   - Solution: `pip install -r requirements.txt`

4. **Port Already in Use**: Another process is using port 8000
   - Solution: Kill the process or use a different port

## Development Tips

- Use `--reload` flag for auto-reload on code changes
- Check logs in terminal for errors
- Use `/docs` endpoint for interactive API testing
- Keep backend terminal open while developing


