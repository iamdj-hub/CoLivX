# CoLivX

CoLivX is a full-stack co-living app for finding compatible roommates and rooms. It includes Firebase sign-in, profile onboarding, preference-based matching, room listings with photos, reviews, geospatial room search, and real-time direct messaging.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Firebase Auth, Socket.IO client
- Backend: Express, MongoDB/Mongoose, Firebase Admin, Socket.IO, Cloudinary
- Deployment: Vercel frontend and Render backend

## Local Setup

Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables you must configure:

- `MONGO_URI`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` or `FRONTEND_URLS`

Frontend variables you must configure:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Run locally:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

The backend defaults to `http://localhost:5000`; the frontend defaults to Vite's `http://localhost:5173`.

## Security Model

Protected backend routes require a Firebase ID token in the `Authorization: Bearer <token>` header. The frontend attaches this automatically for Axios calls and authenticated fetches.

Socket.IO chat also authenticates with a Firebase ID token during connection. The server ignores client-supplied sender IDs and uses the verified Firebase UID.

Admin-only maintenance routes use `ADMIN_UIDS`, a comma-separated list of Firebase UIDs.

## Verification

```bash
cd backend && npm test
cd frontend && npm run lint && npm run build
```
