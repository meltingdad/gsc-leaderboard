# GSC Arena - Supabase-Only Setup 🚀

**Complete guide to running GSC Leaderboard with Supabase only** - No Prisma, No NextAuth, just pure Supabase goodness!

---

## Why Supabase-Only?

✅ **Simpler Setup** - No Prisma generate, no NextAuth configuration
✅ **Integrated Auth** - Supabase handles Google OAuth natively
✅ **Better DX** - If you're comfortable with Supabase, this is much easier
✅ **Built-in Features** - Row Level Security, realtime, storage all included
✅ **Fewer Dependencies** - Smaller bundle, faster builds

---

## What Changed?

### Removed:
- ❌ Prisma & `@prisma/client`
- ❌ NextAuth (`next-auth`)
- ❌ Complex Prisma schema files
- ❌ `prisma generate` step

### Added:
- ✅ `@supabase/supabase-js`
- ✅ `@supabase/ssr` for Next.js integration
- ✅ Direct SQL schema (`supabase/schema.sql`)
- ✅ Supabase Auth with Google OAuth

---

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `gsc-arena`
   - **Database Password**: Generate and save it
   - **Region**: Closest to you
4. Click **"Create project"** and wait (2-3 minutes)

---

### 2. Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...`

3. Update `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

---

### 3. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy entire contents of `supabase/schema.sql`
4. Paste and click **"Run"**

This creates:
- `websites` table
- `metrics` table
- Indexes for performance
- Row Level Security policies
- `leaderboard` view for easy querying

---

### 4. Set Up Google OAuth in Supabase

#### 4.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `GSC Leaderboard`
3. Enable APIs:
   - **Google Search Console API**
   - **Google+ API**

#### 4.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - App name: `GSC Arena`
   - User support email: your email
   - Developer email: your email
4. **Scopes** → Add:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/webmasters.readonly`
5. **Test users** → Add your Gmail

#### 4.3 Create OAuth Credentials

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `GSC Arena Web`
5. **Authorized redirect URIs** - Add:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR-PROJECT-REF` with your Supabase project reference)
6. Click **Create**
7. **Copy Client ID and Client Secret**

#### 4.4 Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Paste:
   - **Client ID**: from Google Cloud
   - **Client Secret**: from Google Cloud
4. **Additional Scopes**: `https://www.googleapis.com/auth/webmasters.readonly`
5. Click **Save**

---

### 5. Update Site URL & Redirect URLs

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000` (for dev)
   - **Redirect URLs**: Add:
     ```
     http://localhost:3000
     http://localhost:3000/**
     ```

For production, add your production domain.

---

### 6. Install Dependencies & Run

```bash
# Install dependencies (if not done already)
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000**

---

## How It Works Now

### Authentication Flow

1. User clicks **"ENTER ARENA"**
2. Supabase redirects to Google OAuth
3. User authorizes (including Search Console access)
4. Google redirects back to `/auth/callback`
5. Supabase exchanges code for session
6. User is logged in!

### Adding a Website

1. Click **"Add Site"** (authenticated)
2. App fetches GSC sites using Google's access token
3. User selects a website
4. App calls `/api/websites` to:
   - Fetch metrics from Google Search Console API
   - Insert into Supabase `websites` table
   - Insert metrics into `metrics` table
5. Website appears on leaderboard instantly!

### Viewing Leaderboard

- Uses `leaderboard` view in Supabase
- Automatically sorted by clicks (descending)
- Row Level Security ensures all users can view
- Real-time updates possible with Supabase Realtime

---

## Key Differences from Prisma Version

| Feature | Prisma Version | Supabase Version |
|---------|---------------|------------------|
| **ORM** | Prisma Client | Supabase JS Client |
| **Auth** | NextAuth.js | Supabase Auth |
| **Schema** | `schema.prisma` | SQL file |
| **Migrations** | `prisma migrate` | SQL Editor |
| **Setup** | Multi-step | Single SQL script |
| **OAuth** | Configure in code | Configure in dashboard |

---

## Remaining Code Updates Needed

Since I started the refactor, here's what still needs updating:

### ✅ Already Done:
- Removed Prisma/NextAuth dependencies
- Created Supabase client utilities
- Updated Navbar to use Supabase Auth
- Created auth callback route
- Created SQL schema

### ⚠️ Still TODO:
1. **Update Hero component** - Use Supabase Auth instead of NextAuth
2. **Update AddWebsiteDialog** - Accept `user` prop from Supabase
3. **Refactor API routes**:
   - `/api/gsc/sites` - Use Supabase to get user's access token
   - `/api/websites` - Use Supabase client instead of Prisma
4. **Update page.tsx** - Fetch from Supabase view instead of mock data

---

## Quick Migration Guide

### From Current Code → Supabase-Only

**For Components:**
```typescript
// OLD (NextAuth)
import { useSession } from 'next-auth/react'
const { data: session } = useSession()

// NEW (Supabase)
import { createClient } from '@/lib/supabase/client'
const [user, setUser] = useState(null)
const supabase = createClient()

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })
}, [])
```

**For API Routes:**
```typescript
// OLD (Prisma)
import { prisma } from '@/lib/prisma'
const websites = await prisma.website.findMany()

// NEW (Supabase)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: websites } = await supabase
  .from('websites')
  .select('*')
```

---

## Testing the Application

1. **Sign In**: Click "ENTER ARENA" → Authorize with Google
2. **Add Website**: Click "Add Site" → Select GSC property
3. **View Leaderboard**: See your site ranked by clicks!

---

## Advantages Over Prisma Setup

1. ✅ **No `prisma generate` step** - just SQL
2. ✅ **OAuth configured in dashboard** - no code changes
3. ✅ **Built-in RLS** - automatic security
4. ✅ **Realtime possible** - subscribe to table changes
5. ✅ **Simpler deployment** - just env vars
6. ✅ **Better for Supabase users** - familiar patterns

---

## Troubleshooting

### "Invalid redirect URL"
- Check Supabase **Authentication** → **URL Configuration**
- Make sure callback URL matches exactly

### "User not found"
- Make sure you added yourself as test user in Google Cloud Console
- Check that Google OAuth is enabled in Supabase

### Database errors
- Verify you ran the `schema.sql` in Supabase SQL Editor
- Check tables exist in **Database** → **Tables**

---

## Production Deployment

1. Update environment variables with production values
2. Add production URL to Supabase redirect URLs
3. Add production URL to Google OAuth redirect URIs
4. Enable automatic database backups in Supabase
5. Consider enabling Supabase Realtime for live updates

---

## Need the Full Refactor?

If you want me to complete the full refactor to Supabase-only:

1. I can update all remaining components
2. Rewrite all API routes to use Supabase
3. Remove all Prisma/NextAuth code
4. Test end-to-end flow

Just let me know and I'll complete it!

---

**Bottom Line**: The Supabase-only approach is simpler, especially if you're already comfortable with Supabase. Less code, fewer dependencies, easier setup! 🎉
