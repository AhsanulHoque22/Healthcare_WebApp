# Cloud Deployment Guide (Railway + Netlify) 🚀

This guide provides the final steps to deploy your Healthcare Web App to the cloud.

---

## 🏗️ 1. Railay (Backend & MySQL)

### Step A: Initialize Backend
1.  Go to [Railway.app](https://railway.app/) and create a **New Project**.
2.  Select **Deploy from GitHub repo** and choose your repository.
3.  **IMPORTANT**: In the "Root Directory" settings, set it to **`server`**.

### Step B: Add MySQL
1.  Inside your Railway project, click **New** -> **Database** -> **Add MySQL**.
2.  Railway will automatically provide the connection variables.

### Step C: Environment Variables (Railway)
Go to the **Variables** tab of your **backend service** and add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://your-netlify-app.netlify.app` (Add after Step 2) |
| `JWT_SECRET` | `a-long-random-string` |
| `CLOUDINARY_CLOUD_NAME` | `Healthcare` |
| `CLOUDINARY_API_KEY` | `475256397831856` |
| `CLOUDINARY_API_SECRET` | `utmJZxwNsIL_BpgQq9FqIi8b87c` |
| `DB_SYNC` | `true` (Set to true only for the first run to create tables) |

*Note: DB variables like `MYSQLHOST`, `MYSQLUSER`, etc., are automatically linked by Railway.*

---

## 🌐 2. Netlify (Frontend)

### Step A: Initialize Frontend
1.  Go to [Netlify.com](https://www.netlify.com/) and click **Add new site** -> **Import an existing project**.
2.  Select your GitHub repository.
3.  Configure the build settings:
    - **Base directory**: `client`
    - **Build command**: `npm run build`
    - **Publish directory**: `build`

### Step B: Environment Variables (Netlify)
Go to **Site configuration** -> **Environment variables** and add:

| Key | Value |
| :--- | :--- |
| `REACT_APP_API_URL` | `https://your-railway-backend.up.railway.app/api` |

---

## 🧪 3. Final Verification

1.  **Deployment**: Wait for both builds to finish.
2.  **CORS**: Once you have your Netlify URL, remember to add it to the `CLIENT_URL` in Railway variables.
3.  **Live Check**: Visit your Netlify URL and try to upload a profile picture. It should now persist forever via Cloudinary!

## 📱 Mobile Video (Jitsi)
Since you are now on **HTTPS** (provided by Netlify/Railway), you **no longer** need to set any Chrome flags on your phone! Video consultations will work out of the box.
