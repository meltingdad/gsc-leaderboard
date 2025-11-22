# GSC Arena - Setup Guide

Complete setup instructions for the Google Search Console Leaderboard.

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account
- A Supabase account (free tier works)

---

## Step 1: Supabase Database Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - Project name: `gsc-arena` (or your preferred name)
   - Database password: Generate a strong password and **save it**
   - Region: Choose closest to your location
4. Click **"Create new project"** and wait for it to initialize

### 1.2 Get Database Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **"Direct Connection"** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the database password you created

### 1.3 Configure Environment Variables

1. Open `.env` in the project root
2. Update the `DATABASE_URL` with your Supabase connection string:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
   ```

**Note:** With Prisma 7, the database URL is configured in `prisma.config.ts` (which reads from the `.env` file), not in the schema file.

---

## Step 2: Google OAuth Setup

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top left) → **"New Project"**
3. Name it `GSC Leaderboard` → Click **"Create"**
4. Wait for the project to be created and select it

### 2.2 Enable Google APIs

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **"Google Search Console API"** - Click **"Enable"**
   - **"Google+ API"** - Click **"Enable"**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** → Click **"Create"**
3. Fill in the required fields:
   - **App name**: `GSC Arena`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **"Save and Continue"**
5. On **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Search for and select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `.../auth/webmasters.readonly`
   - Click **"Update"** → **"Save and Continue"**
6. On **Test users** page:
   - Click **"Add Users"**
   - Add your Gmail address
   - Click **"Save and Continue"**

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select:
   - Application type: **"Web application"**
   - Name: `GSC Arena Web`
4. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (Add production URL later when deploying)
5. Click **"Create"**
6. **Copy your Client ID and Client Secret** - you'll need these!

### 2.5 Update Environment Variables

1. Open `.env` in the project root
2. Add your Google OAuth credentials:
   ```
   GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret-here"
   ```

### 2.6 Generate NextAuth Secret

1. Run this command to generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
2. Copy the output and update `.env`:
   ```
   NEXTAUTH_SECRET="your-generated-secret-here"
   ```

---

## Step 3: Database Migration

### 3.1 Generate Prisma Client

```bash
npx prisma generate
```

### 3.2 Push Database Schema

```bash
npx prisma db push
```

This will create all necessary tables in your Supabase database.

### 3.3 Verify Database (Optional)

1. Go to Supabase Dashboard → **Table Editor**
2. You should see these tables:
   - `users`
   - `accounts`
   - `sessions`
   - `websites`
   - `metrics`
   - `verification_tokens`

---

## Step 4: Run the Application

### 4.1 Install Dependencies (if not already done)

```bash
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

The application should now be running at **http://localhost:3000** (or 3001 if 3000 is in use)

---

## Step 5: Testing the Application

### 5.1 Sign In

1. Click **"ENTER ARENA"** or **"Add Site"** button
2. You'll be redirected to Google OAuth consent screen
3. Sign in with your Google account (must be added as test user)
4. Grant the requested permissions

### 5.2 Add a Website

1. After signing in, click **"Add Site"** in the navbar
2. Select a website from your Google Search Console
3. Click **"Add"**
4. Wait for metrics to be fetched
5. Your website should appear on the leaderboard!

---

## Troubleshooting

### "Unauthorized" Error
- Make sure you added your email as a test user in Google Cloud Console
- Check that all Google APIs are enabled

### Database Connection Errors
- Verify your Supabase connection string is correct
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- Run `npx prisma db push` again

### "No websites found"
- Make sure you have websites added to Google Search Console
- Visit [search.google.com/search-console](https://search.google.com/search-console)

### OAuth Redirect Error
- Make sure `http://localhost:3000/api/auth/callback/google` is in authorized redirect URIs
- Check that `NEXTAUTH_URL` in `.env` matches your development URL

---

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. **Update Environment Variables** in your hosting platform with production values
2. **Update Google OAuth**:
   - Add production URL to authorized redirect URIs:
     ```
     https://your-domain.com/api/auth/callback/google
     ```
3. **Update NEXTAUTH_URL**:
   ```
   NEXTAUTH_URL=https://your-domain.com
   ```
4. **Publish OAuth App** (remove "Testing" status in Google Cloud Console)

---

## Next Steps

- Set up periodic background jobs to refresh GSC metrics (cron job or Vercel Cron)
- Add more features (website deletion, user profiles, etc.)
- Customize the design and branding

---

Need help? Check the [Next.js docs](https://nextjs.org/docs), [NextAuth docs](https://next-auth.js.org/), or [Supabase docs](https://supabase.com/docs).
