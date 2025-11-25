# API Key Setup Guide

## Current Error

The backend is returning a 500 error because the **Gemini API key is expired or invalid**.

## How to Fix

### 1. Get a New Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the new API key

### 2. Update Your .env File

Edit `/Users/raushankumar/Desktop/eduverse-dashboard/backend/.env`:

```bash
# Update this line with your new API key
GEMINI_API_KEY=your-new-api-key-here
```

### 3. Restart the Backend Server

After updating the .env file:

```bash
# Stop the current server (Ctrl+C in the terminal running it)
# Then restart:
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Required API Keys

Make sure your `.env` file has all these keys:

```bash
# Gemini AI (Required for AI Tutoring)
GEMINI_API_KEY=your-gemini-api-key

# Wolfram Alpha (Required for math solutions)
WOLFRAM_APP_ID=your-wolfram-app-id

# Google Cloud Translation (Optional - for translation features)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Supabase (Required)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Other keys...
```

## Quick Test

After updating the API key, test it:

```bash
curl -X POST http://localhost:8000/api/ai-tutoring/answer \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "question": "What is 2+2?",
    "subject": "mathematics"
  }'
```

## Alternative: Use Without Gemini (Limited Functionality)

If you don't have a Gemini API key yet, you can:
1. Comment out the AI tutoring routes temporarily
2. Use other features that don't require Gemini
3. The chat interface will show an error until the key is configured

## Getting API Keys

- **Gemini API**: Free tier available at https://makersuite.google.com/app/apikey
- **Wolfram Alpha**: Sign up at https://www.wolframalpha.com/api/
- **Google Cloud**: Free tier available, requires credit card but won't charge unless you exceed free limits


