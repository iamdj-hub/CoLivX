# CoLivX Deployment

## 1. Push to GitHub

Create a GitHub repository, then from this project root:

```bash
git init
git add .
git commit -m "Prepare CoLivX for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

The root `.gitignore` excludes `.env`, `node_modules`, and build output.

## 2. Deploy Backend on Render

Use Render's **New Web Service** or **Blueprint** flow and connect the GitHub repo.

Backend settings if creating manually:

- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Add these Render environment variables:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_uri
FRONTEND_URL=https://your-vercel-app.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_PROJECT_ID=your_firebase_project_id
ADMIN_UIDS=comma_separated_firebase_uids_for_admin_routes
```

Create `FIREBASE_SERVICE_ACCOUNT_JSON` in Firebase Console:

Project settings > Service accounts > Generate new private key.

Paste the JSON as a single environment variable value. Keep newline escapes as `\n` if your host requires a single-line value.

For token verification only, `FIREBASE_PROJECT_ID` can also be used. It must exactly match the frontend `VITE_FIREBASE_PROJECT_ID`.

After deploy, copy the Render URL, for example:

```text
https://colivx-backend.onrender.com
```

## 3. Deploy Frontend on Vercel

Import the same GitHub repository in Vercel.

Frontend settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Add these Vercel environment variables:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 4. Final Connection Step

After Vercel gives you the live frontend URL, go back to Render and set:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Redeploy the Render backend after changing `FRONTEND_URL`.

If you use Vercel preview or custom domains, add each exact origin to `FRONTEND_URLS` as a comma-separated list. The backend intentionally does not allow every `*.vercel.app` origin.

## 5. Firebase Auth Domain

In Firebase Console, add your Vercel domain to:

Authentication > Settings > Authorized domains

Add both your production domain and any preview domain you use.
