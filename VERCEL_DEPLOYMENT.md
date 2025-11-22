# Vercel Deployment Guide 🚀

Complete step-by-step guide to deploy GSC Arena to Vercel.

---

## Prerequisites ✅

Before deploying, make sure you have:

1. ✅ **Supabase project set up** with:
   - Database schema executed (`supabase/schema.sql`)
   - Project URL and Anon Key
   - Google OAuth configured in Supabase Auth

2. ✅ **GitHub repository** pushed:
   - Repository: `https://github.com/meltingdad/gsc-arena`

3. ✅ **Google Cloud OAuth** credentials ready:
   - Client ID
   - Client Secret
   - Google Search Console API enabled

---

## Step 1: Import Project to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account (meltingdad)
3. Click **"Add New..."** → **"Project"**
4. **Import your repository**:
   - Find `meltingdad/gsc-arena`
   - Click **"Import"**

---

## Step 2: Configure Project Settings

### Framework Preset
- Vercel should auto-detect: **Next.js**
- Build Command: `next build` (auto-detected)
- Output Directory: `.next` (auto-detected)
- Install Command: `npm install` (auto-detected)

**Leave these as default** - Vercel handles Next.js perfectly!

---

## Step 3: Add Environment Variables

In the Vercel import screen, expand **"Environment Variables"** section.

Add these **EXACTLY** as shown:

### Required Environment Variables:

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fklnzldhzpnftyjkzext.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_mOKT-GwId12kjArHAXxKXQ_E2k0x-67` | Supabase Dashboard → Settings → API → Project API keys → anon/public |

### How to Add Each Variable:

1. **Key**: Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
2. **Value**: Paste the corresponding value
3. **Environment**: Check all three: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Add"**
5. Repeat for all variables

**⚠️ IMPORTANT**:
- The `NEXT_PUBLIC_` prefix is required for these variables
- Use your actual Supabase URL and key (I've filled in your current values above)

---

## Step 4: Deploy!

1. Click **"Deploy"** button
2. Wait for the build to complete (~2-3 minutes)
3. Vercel will show build logs in real-time

Expected build output:
```
✓ Compiling
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization
```

---

## Step 5: Get Your Production URL

Once deployed, Vercel will provide:

- **Production URL**: `https://gsc-arena.vercel.app`
- Or custom domain if you add one

**Save this URL** - you'll need it for the next steps!

---

## Step 6: Update Supabase Redirect URLs

Go to your **Supabase Dashboard**:

1. Navigate to **Authentication** → **URL Configuration**
2. Update **Site URL** to your Vercel URL:
   ```
   https://gsc-arena.vercel.app
   ```

3. Add to **Redirect URLs** (keep localhost too):
   ```
   http://localhost:3000
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://gsc-arena.vercel.app
   https://gsc-arena.vercel.app/**
   https://gsc-arena.vercel.app/auth/callback
   ```

4. Click **"Save"**

---

## Step 7: Update Google OAuth Configuration

Go to **Google Cloud Console**: https://console.cloud.google.com

1. Select your project
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, add:
   ```
   https://fklnzldhzpnftyjkzext.supabase.co/auth/v1/callback
   ```
   (This should already be there from local setup)

5. Click **"Save"**

---

## Step 8: Test Your Deployment 🎉

1. **Visit your production URL**: `https://gsc-arena.vercel.app`
2. **Test authentication**:
   - Click **"ENTER"** or **"Add Site"**
   - You should be redirected to Google OAuth
   - Sign in and authorize
   - You should be redirected back to your app
   - Your profile should appear in the navbar

3. **Test website submission**:
   - Click **"Add Site"**
   - Select a GSC property
   - Submit to leaderboard
   - Verify it appears in the leaderboard table

---

## Optional: Add Custom Domain

### In Vercel:

1. Go to your project **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `gsc-arena.com`)
4. Follow Vercel's DNS configuration instructions

### Then Update:

1. **Supabase redirect URLs** - Add your custom domain
2. **Google OAuth redirect URIs** - No change needed (uses Supabase URL)

---

## Troubleshooting 🔧

### Build Fails

**Error**: `Module not found`
- **Fix**: Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error**: `Type error in ...`
- **Fix**: Run `npm run build` locally first
- Fix any TypeScript errors before deploying

### Authentication Issues

**Error**: `Invalid redirect URL`
- **Fix**: Check Supabase redirect URLs match your Vercel URL exactly
- Include `/auth/callback` endpoint

**Error**: `User not authorized`
- **Fix**: Make sure you're added as test user in Google Cloud Console
- Check that Google OAuth is enabled in Supabase

### Environment Variables Not Working

**Symptom**: App loads but can't connect to Supabase
- **Fix**:
  1. Check environment variables in Vercel dashboard
  2. Make sure they have `NEXT_PUBLIC_` prefix
  3. Redeploy after adding/changing env vars

---

## Monitoring & Logs

### View Logs:
1. Go to your Vercel project dashboard
2. Click **"Deployments"**
3. Click on a deployment
4. Click **"Functions"** or **"Runtime Logs"**

### Check Performance:
1. Vercel provides **Analytics** (may require upgrade)
2. Or use **Supabase Dashboard** to monitor database queries

---

## Redeployment

### Automatic Deployments:
- Every push to `main` branch triggers automatic deployment
- Vercel rebuilds and redeploys automatically

### Manual Redeploy:
1. Go to Vercel project dashboard
2. Click **"Deployments"**
3. Click **"..."** on a deployment
4. Click **"Redeploy"**

---

## Production Checklist ✓

Before going live:

- [ ] Database schema executed in Supabase
- [ ] Google OAuth configured and **published** (not in testing mode)
- [ ] All environment variables added to Vercel
- [ ] Supabase redirect URLs updated with production URL
- [ ] Test authentication flow works
- [ ] Test website submission works
- [ ] Leaderboard displays correctly
- [ ] Mobile responsive (test on phone)
- [ ] Error handling works (try invalid actions)

---

## Cost & Limits

### Vercel Free Tier:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ SSL certificates included
- ✅ Automatic HTTPS

### Supabase Free Tier:
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ 5GB bandwidth

**Should be plenty for starting out!** 🎉

---

## Next Steps After Deployment

1. **Share your link**: `https://gsc-arena.vercel.app`
2. **Monitor usage** in Vercel and Supabase dashboards
3. **Add features** from the roadmap
4. **Invite users** to join the leaderboard
5. **Consider adding**:
   - Custom domain
   - Analytics (Vercel Analytics or Google Analytics)
   - Error tracking (Sentry)
   - Background jobs for metric updates

---

## Support Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

**Your app is now live! 🚀**

**Enter the arena at**: `https://gsc-arena.vercel.app`
