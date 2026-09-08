# Production deployment

1. Push this repository to GitHub (or another Git provider connected to Render and Netlify).
2. In Render, create a **New Blueprint Instance**, select the repository, and deploy `render.yaml`.
   This provisions `medbridge-api`, a Render Postgres database, generates the Prisma client, and applies migrations.
3. Wait for the API health check to succeed at `https://<your-render-service>.onrender.com/api/health`.
4. In Netlify, set the environment variable `API_URL` to that Render API origin, for example `https://medbridge-api.onrender.com`.
5. Trigger a new Netlify deploy. The build injects that URL into `frontend/public/_redirects`, so existing Angular calls to `/api/...` reach the API.

The API uses `FRONTEND_URL=https://medbridgeacademy0.netlify.app` for CORS. Update that value in Render if the frontend domain changes.
