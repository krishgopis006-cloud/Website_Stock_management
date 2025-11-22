# Deployment Guide & Data Persistence

## ⚠️ Critical: Data Loss Warning
If you are hosting this application on a cloud provider like **Render, Vercel, Heroku, or Glitch**, you **CANNOT** use the default SQLite database.
- **Why?** These platforms use "ephemeral filesystems". When your app "sleeps" (inactivity) or redeploys, **all files are deleted**, including your database.
- **Result:** Your stock data will reset every few hours.

## ✅ The Solution: Use PostgreSQL
To fix this, you must connect your application to a persistent PostgreSQL database.

### Step 1: Get a Free PostgreSQL Database
You can get a free PostgreSQL database from:
- **Neon.tech** (Recommended, easiest)
- **Supabase**
- **Render** (Has a PostgreSQL addon)

### Step 2: Get the Connection String
Once created, copy the **Connection String** (often called `DATABASE_URL`). It looks like this:
`postgres://user:password@hostname.com/dbname?sslmode=require`

### Step 3: Configure Your Host
1. Go to your hosting dashboard (e.g., Render Dashboard).
2. Find the **Environment Variables** section.
3. Add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** (Paste your connection string from Step 2)
4. Redeploy your application.

### Step 4: Verify
Your application will now detect the `DATABASE_URL` and automatically switch from SQLite to PostgreSQL. Your data will now be safe and persistent.

## ❓ Troubleshooting
### Error: `connect ENETUNREACH ...`
If you see an error like `connect ENETUNREACH` with an IPv6 address (e.g., `2406:da18...`), it means the server is trying to connect via IPv6 but failing.
- **Fix:** We have updated the code to force IPv4. **Redeploy the latest code.**
- **Alternative Fix:** Add an environment variable `NODE_OPTIONS` with value `--dns-result-order=ipv4first`.
