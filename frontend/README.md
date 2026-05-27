# CoLivX Frontend

React/Vite client for CoLivX.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_API_BASE_URL`
- Firebase web app variables prefixed with `VITE_FIREBASE_`

Authenticated API calls attach the current Firebase ID token automatically from `src/api.js`.
