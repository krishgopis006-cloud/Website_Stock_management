# Deploying to Vercel

This guide will help you deploy your website (Frontend + Backend) to Vercel for free.

## Prerequisites

1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.
3.  **PostgreSQL Database**: You need a cloud database. **Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) first.**

## Steps

### 1. Push Code to GitHub
If you haven't already, push your latest changes to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Import Project in Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your repository (`Website_Stock_management` or similar) and click **"Import"**.

### 3. Configure Project
Vercel will detect that this is a Vite project.
-   **Framework Preset**: Vite (should be auto-detected).
-   **Root Directory**: `./` (default).

**Environment Variables:**
You MUST add your database URL here.
1.  Expand the **"Environment Variables"** section.
2.  Add a new variable:
    -   **Key**: `DATABASE_URL`
    -   **Value**: `postgres://postgres.tkobagalbdlwamqjmgpk:Gopi%40061199@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`
    -   *(I have already formatted this for you with the correct password encoding)*

### 4. Deploy
1.  Click **"Deploy"**.
2.  Wait for the build to finish.
3.  Once deployed, you will get a URL (e.g., `https://your-project.vercel.app`).

## Troubleshooting
-   **Database Error**: If you see database errors, check your `DATABASE_URL` in Vercel Settings. Ensure you are using the **Connection Pooler** URL from Supabase.
-   **API Errors**: The frontend is configured to look for `/api/...`. This is handled by `vercel.json`. If API calls fail, check the "Logs" tab in Vercel for the server function.
