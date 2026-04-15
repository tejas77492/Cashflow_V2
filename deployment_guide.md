# 🚀 Free Deployment Guide

Deploying your full-stack application (React, Node.js, MongoDB) for free is completely possible using the right combination of services. 

Here is the best free tech stack for your app:
1. **Database:** MongoDB Atlas (Free 512MB Cluster)
2. **Backend (Node.js/Express):** Render (Free Web Service)
3. **Frontend (React/Vite):** Vercel or Netlify (Free Tier)

---

## Step 1: Deploy Database (MongoDB Atlas)
Right now, your app uses a local database (`mongodb://127.0.0.1:27017`), which won't work on the internet. We need to move it to the cloud.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new database cluster (Select the **M0 Free** tier).
3. Under **Security > Database Access**, create a user (e.g., `admin`) and set a password. Save this password!
4. Under **Security > Network Access**, click "Add IP Address" and select **Allow Access from Anywhere** (`0.0.0.0/0`) so your backend can connect to it.
5. Go to **Database > Connect > Connect your application**.
6. Copy the connection string. It will look something like: 
   `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/cashflow?retryWrites=true&w=majority`
7. *(Optional)* Download **MongoDB Compass**, connect to your new Atlas database with this string, and manually export/import your current local data if you want to keep it.

---

## Step 2: Deploy Backend (Render)
Render is a great free hosting provider for backend Node.js apps.

1. Upload your entire project to a new **GitHub Repository**. Make sure **node_modules** and **.env** are tracked by `.gitignore` (they currently are).
2. Go to [Render](https://render.com/) and sign up.
3. Click **New +** > **Web Service**. Connect your GitHub account and select your repository.
4. Render will ask for setup details:
   - **Root Directory:** `backend` (Because your backend is in this folder).
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Scroll down to **Environment Variables** and add the variables from your backend `.env`:
   - `PORT`: `5000`
   - `JWT_SECRET`: `your_super_secret_key`
   - `MONGODB_URI`: *Paste your MongoDB Atlas Connection String here! (Replace `<password>` with your real password)*
6. Click **Create Web Service**. Wait a few minutes. If successful, Render will give you a live URL like `https://cashflow-backend-xyz.onrender.com`.

---

## Step 3: Deploy Frontend (Vercel)
Your frontend is React powered by Vite. Vercel specializes in this and is incredibly fast and completely free.

1. Your frontend's API calls are already set up perfectly to be dynamic! In `frontend/src/services/api.js`, it uses `import.meta.env.VITE_API_BASE_URL`.
2. Go to [Vercel](https://vercel.com/) and sign up with GitHub.
3. Click **Add New > Project** and import your GitHub repository.
4. Configure the Project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` (Click edit and select your frontend folder).
5. Open the **Environment Variables** section and add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://cashflow-backend-xyz.onrender.com/api` *(Make sure to use the exact Render backend URL you got from Step 2, and append `/api` to it)*. 
6. Click **Deploy**! 

---

### 🎉 You're Done!
Once Vercel finishes, it will give you a live URL for your frontend (e.g., `https://cashflow-app.vercel.app`). Anyone can now visit that URL to use your app, which will securely talk to your Render backend, which in turn saves data to your MongoDB Atlas cloud database.

> [!NOTE]
> **Important Note about Free Tiers:** On Render's free tier, the backend goes to "sleep" after 15 minutes of inactivity. When you visit your frontend for the first time in a while, the very first login/API request might take 30-50 seconds as the backend wakes up. This is normal for free hosting!
