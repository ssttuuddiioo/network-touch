# 🚀 Supabase Migration Setup Guide

Your framer-motion-bubbles app has been successfully migrated to support Supabase! Here's how to get it up and running.

## 📋 Prerequisites

1. **Supabase Account**: Go to [supabase.com](https://supabase.com) and create a free account
2. **Your app is ready**: All code changes have been implemented

## 🔧 Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `framer-motion-bubbles` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for setup to complete (~2 minutes)

### Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (looks like: `eyJhbGciOi...`)

### Step 3: Configure Your App

1. Open `/src/config/supabase.js`
2. Replace the placeholder values:
   ```javascript
   const supabaseUrl = 'https://your-project.supabase.co';  // ← Your Project URL
   const supabaseKey = 'your-anon-key-here';                // ← Your anon key
   ```

### Step 4: Set Up Database Table

You have two options:

#### Option A: Automatic Setup (Recommended)
1. Start your app: `npm run dev`
2. Go to `/admin` and login with password: `admin`
3. You'll see a Supabase status banner
4. Click **"Migrate CSV to Supabase"** to automatically create the table and import data

#### Option B: Manual Setup
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS companies (
     id BIGSERIAL PRIMARY KEY,
     name TEXT UNIQUE NOT NULL,
     logo TEXT DEFAULT '',
     images JSONB DEFAULT '[]',
     header_image TEXT DEFAULT '',
     tagline TEXT DEFAULT '',
     description TEXT DEFAULT '',
     detroit_story TEXT DEFAULT '',
     funding TEXT DEFAULT '',
     industry JSONB DEFAULT '[]',
     website TEXT DEFAULT '',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
   CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies USING GIN(industry);

   -- Enable Row Level Security
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON companies
     FOR SELECT USING (true);

   CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON companies
     FOR ALL USING (auth.role() = 'authenticated');
   ```
3. Click **Run**
4. Use the admin panel to migrate your CSV data

## 🎯 What's New

### Admin Panel Features
- **Real-time sync**: Changes appear instantly across all users
- **Migration status**: See if your database is in sync with CSV
- **Supabase integration**: All data stored in cloud database
- **Fallback support**: Still works with localStorage if Supabase isn't configured

### User Interface
- **Live updates**: Company grid updates in real-time when admins make changes
- **No changes needed**: Everything works exactly the same for end users
- **Better performance**: Database queries instead of CSV parsing

## 🔄 Data Flow

1. **CSV → Supabase**: Import your existing CSV data into the database
2. **Admin Changes**: All admin edits save directly to Supabase
3. **Live Updates**: Changes appear immediately on the main interface
4. **Export**: Download current database state as CSV

## 🛠 Troubleshooting

### App Still Uses CSV Data
- Check that your Supabase URL and key are correctly set in `/src/config/supabase.js`
- Make sure the database table exists (run the SQL or use migration)
- Check browser console for any connection errors

### Migration Fails
- Verify your Supabase credentials are correct
- Check that you have the correct permissions in Supabase
- Try the manual SQL setup if automatic migration fails

### Real-time Updates Not Working
- Supabase real-time is enabled by default
- Check your browser console for subscription errors
- Refresh the page to force a sync

## 🚀 Deployment Tips

### For Production:
1. **Use environment variables** instead of hardcoding credentials
2. **Restrict database policies** for better security
3. **Enable RLS policies** for multi-tenant access
4. **Consider upgrading** Supabase plan for higher limits

### Environment Variables (Optional):
Create a `.env` file:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## ✅ Verification

After setup, you should see:
- ✅ Admin panel shows "Supabase Enabled"
- ✅ Migration status shows database is in sync
- ✅ Adding/editing companies works instantly
- ✅ Changes appear on main interface immediately
- ✅ Multiple admin users can work simultaneously

## 🎉 You're Done!

Your app now has:
- ☁️ **Cloud database storage**
- 🔄 **Real-time synchronization**
- 👥 **Multi-user admin access**
- 📊 **Better data management**
- 🚀 **Production-ready architecture**

Need help? Check the browser console for detailed logs and error messages.
