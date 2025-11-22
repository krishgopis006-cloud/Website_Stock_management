# Setting up a Free Database with Supabase

Since Vercel only hosts the website code, we need a separate place to store your data (inventory, transactions, users). **Supabase** offers a generous free tier that is perfect for this.

## Step 1: Create a Supabase Account
1. Go to [supabase.com](https://supabase.com).
2. Click **"Start your project"**.
3. Sign up with your GitHub account (recommended) or email.

## Step 2: Create a New Project
1. Once logged in, click **"New Project"**.
2. Select your organization (if asked).
3. **Name**: Enter a name like `stock-management-db`.
4. **Database Password**:
   - **IMPORTANT**: Click "Generate a password" or type a strong one.
   - **COPY THIS PASSWORD NOW**. You will not be able to see it again. You will need it later.
5. **Region**: Select a region close to you (e.g., Singapore, Mumbai, etc.).
6. Click **"Create new project"**.
7. Wait a few minutes for the database to be provisioned.

## Step 3: Get the Connection String
We need the special URL that allows your website to talk to the database.

1. In your project dashboard, go to **Project Settings** (gear icon at the bottom left).
2. Click on **"Database"** in the side menu.
3. Scroll down to the **"Connection parameters"** section.
4. Look for **"Connection String"** and make sure **"URI"** is selected (not JDBC or .NET).
5. **CRITICAL STEP**:
   - Change the **Mode** from "Transaction" to **"Session"**? **NO**.
   - **ACTUALLY**: For Vercel (Serverless), it is often recommended to use the **Connection Pooler**.
   - Look at the top of the Connection String box. If you see a toggle for **"Use connection pooler"**, turn it **ON**.
   - Set **Mode** to **"Transaction"**.
   - Set **Port** to `6543`.
6. Copy the URL. It should look like this:
   ```
   postgres://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

## Step 4: Finalize the URL
1. Paste the URL somewhere safe (like a notepad).
2. Replace `[YOUR-PASSWORD]` with the password you saved in Step 2.
   - Example: If your password is `supersecret`, the part `...:[YOUR-PASSWORD]@...` becomes `...:supersecret@...`.
   - **Note**: If your password has special characters (like `@`, `#`, `/`), you must "URL encode" them. It's easier to just change the password to something with only letters and numbers if you have trouble.

## Step 5: Ready for Vercel
Now you have the `DATABASE_URL` needed for Vercel!
