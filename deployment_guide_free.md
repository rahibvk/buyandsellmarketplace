# Free Hosting Deployment Guide

This guide explains how to host your "Buy and Sell MVP" for free using the following stack:
- **Database**: [Neon](https://neon.tech) (Free Tier Postgres)
- **Backend API**: [Render](https://render.com) (Free Tier Web Service)
- **Frontend & Admin**: [Vercel](https://vercel.com) (Free Tier)

---

## Step 1: Set up the Database (Neon)
1. Go to [Neon.tech](https://neon.tech) and sign up.
2. Create a new project (e.g., `buyandsell-mvp`).
3. It will give you a **Connection String** that looks like:
   `postgres://neondb_owner:*******@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Important**: Copy this string. You will need it for the Backend environment variables.
   > Tip: If your backend library has issues with `postgres://`, change the beginning to `postgresql://`.

---

## Step 2: Deploy Backend (Render)
1. Push your latest code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. **Configuration**:
   - **Name**: `buyandsell-backend` (or similar)
   - **Root Directory**: `backend` (Important! This tells Render where the python app is)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt` (Render should auto-detect this if you moved requirements.txt to backend, otherwise use `pip install -r ../requirements.txt` if it's in root)
     - *Note: We moved `requirements.txt` to `backend/` for you, so `pip install -r requirements.txt` is correct.*
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - *Note: A `Procfile` was created in `backend/` which Render might use automatically.*
   - **Instance Type**: `Free`

6. **Environment Variables** (Click "Advanced"):
   Add the following keys:
   - `DATABASE_URL`: (Paste your Neon connection string here)
   - `SECRET_KEY`: (Generate a random string, e.g., using `openssl rand -hex 32` or just type a long secure string)
   - `PYTHON_VERSION`: `3.11.9` (Optional, keeps python version consistent)
   - `BACKEND_CORS_ORIGINS`: `["*"]` (For simplicity while starting. Later change to your Vercel URL)

7. Click **Create Web Service**.
8. Wait for deployment to finish. Render will give you a URL like `https://buyandsell-backend.onrender.com`.
   - **Copy this URL**.

---

## Step 3: Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and sign up/login.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. **Framework Preset**: Next.js (Should auto-detect).
5. **Root Directory**: Click "Edit" and select `frontend`.
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: (Paste your Render Backend URL + `/api/v1`)
     - Example: `https://buyandsell-backend.onrender.com/api/v1`
7. Click **Deploy**.

---

## Step 4: Deploy Admin Panel (Vercel)
1. Go to Vercel Dashboard.
2. Click **Add New...** -> **Project**.
3. Import the **same** GitHub repository again.
4. **Root Directory**: Click "Edit" and select `frontend-admin`.
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: (Paste your Render Backend URL + `/api/v1`)
     - Example: `https://buyandsell-backend.onrender.com/api/v1`
6. Click **Deploy**.

---

## Important Notes on Free Tiers
- **Render Free Tier**: The backend will "spin down" after 15 minutes of inactivity. The first request after a break might take 30-50 seconds to respond. This is normal for the free tier.
- **Neon**: Has generous limits but strictly monitors storage size.
- **Data Persistence**: Uploaded files (module `backend/app/uploads`?) will **NOT PERSIST** on Render's ephemeral filesystem. If you restart the server, uploads disappear.
  - **Solution**: For a real production app, use AWS S3 or Supabase Storage for files. For this MVP demo, just know that files might vanish.
