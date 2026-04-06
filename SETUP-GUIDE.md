# 🏆 LPR Step Challenge — Complete Setup Guide
## Step 2: Getting the App Live

---

## BEFORE YOU START
You need:
- Your GitHub account (lpr-step-challenge repo)
- Your Supabase project open
- Your Stripe dashboard open
- This zip file extracted on your computer

---

## PART 1: SUPABASE DATABASE SETUP

1. Go to **supabase.com** → your **lpr-step-challenge** project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `supabase-schema.sql` from this folder
5. Copy ALL the contents and paste into the SQL editor
6. Click **Run** (green button)
7. You should see "Success" ✅

**Set yourself as admin:**
After you first sign up in the app, run this query in the SQL Editor:
```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'robinleaton@leatonperformance.co.nz';
```

---

## PART 2: PUSH YOUR CODE TO GITHUB

Open **Terminal** (Mac) or **Command Prompt** (Windows) and run:

```bash
# Navigate to the extracted folder
cd path/to/lpr-step-challenge

# Install dependencies (first time only)
npm install

# Initialise git and push to your GitHub repo
git init
git add .
git commit -m "Initial LPR Step Challenge build"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/lpr-step-challenge.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username (e.g. leatonperformance)

---

## PART 3: DEPLOY ON VERCEL

1. Go to **vercel.com** → you're already signed in with GitHub
2. Click **Add New Project**
3. Find and select **lpr-step-challenge** from your GitHub repos
4. Click **Import**
5. On the Configure screen, set these **Environment Variables** (click "Add" for each):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://smswedhyzarlietowqun.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full anon key) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51OjCpa...` (your full publishable key) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | `price_1TIkVTCzcwi5q2XuKxSyhHiK` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (your Stripe secret key — KEEP SECRET) |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_APP_URL` | `https://leatonperformance.co.nz/step-challenge` |
| `RESEND_API_KEY` | Sign up free at resend.com for email notifications |

6. Click **Deploy**
7. Wait ~2 minutes for it to build
8. You'll get a URL like `lpr-step-challenge.vercel.app` ✅

---

## PART 4: SET UP STRIPE WEBHOOK

This is critical — it tells the app when someone subscribes or cancels.

1. Go to **Stripe Dashboard** → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to Vercel Environment Variables:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...`
8. Go to Vercel → your project → Settings → Redeploy

---

## PART 5: SHOPIFY REDIRECT

1. Log into your **Shopify admin**
2. Go to **Online Store → Navigation**
3. Click **URL Redirects**
4. Click **Create URL redirect**
5. From: `/step-challenge`
6. To: `https://YOUR-VERCEL-URL.vercel.app`
7. Save

Now `leatonperformance.co.nz/step-challenge` will redirect to your app! ✅

---

## PART 6: FIRST SIGN UP & ADMIN ACCESS

1. Go to your app URL
2. Sign up with `robinleaton@leatonperformance.co.nz`
3. Complete the 14-day trial signup
4. Go to **Supabase SQL Editor** and run:
```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'robinleaton@leatonperformance.co.nz';
```
5. Refresh the app — you'll see a ⚙️ Settings icon in the top right
6. That's your Admin Dashboard!

---

## PART 7: GO LIVE WITH STRIPE (When Ready)

Currently in Test Mode. When ready for real payments:
1. Stripe Dashboard → toggle off Test Mode
2. Recreate the product at $15 NZD/month in Live Mode
3. Update your Vercel env variables with live keys
4. Redo the webhook for live mode

---

## WHAT'S BUILT ✅

- DBZ-style male & female avatars (5 stages, animated)
- Real-time leaderboard (filters by gender & age)
- 14-day free trial → auto $15 NZD/month
- NZ distance comparisons (90 Mile Beach → Cape Reinga to Bluff)
- Admin dashboard (subscribers, challenges, sponsors)
- Sponsor footer (interchangeable with LPR default)
- Dark & light theme
- Push + email notifications (opt-in)
- Prize eligibility enforcement (paid only)
- Age & gender challenge brackets
- Apple Health & Google Fit sync

---

## NEED HELP?

Come back to Claude and say "I'm setting up LPR Step Challenge, I'm on Part X" and I'll help you through it!
