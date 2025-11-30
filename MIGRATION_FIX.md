# Fix for 404 NOT_FOUND Error on Vercel

## Problem
You're seeing this error after deploying to Vercel:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: bom1::pxdzt-1764492447269-fef9d3cb0b5e
```

This happens because the `saved_explanations` table doesn't exist in your Supabase database.

## Solution

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

3. **Push all migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL (Quick Fix)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase/migrations/20251206_add_saved_explanations.sql`
4. Click **Run** to execute the migration

### Option 3: Using Supabase Dashboard Migration Tool

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Migrations**
3. Click **New Migration**
4. Copy the contents of `supabase/migrations/20251206_add_saved_explanations.sql`
5. Paste and run

## Verify the Fix

After applying the migration, verify the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'saved_explanations';
```

You should see `saved_explanations` in the results.

## What This Migration Does

- Creates the `saved_explanations` table
- Sets up proper indexes for performance
- Configures Row Level Security (RLS) policies
- Allows users to save AI-generated explanations

## After Applying

1. The 404 error should be resolved
2. Your Vercel deployment should work correctly
3. Users can save explanations in the Classroom feature

## Need Help?

If you continue to see errors:
1. Check Supabase logs in the dashboard
2. Verify your Supabase project URL and keys are correct in Vercel environment variables
3. Ensure all migrations have been applied (check the migrations list in Supabase)

