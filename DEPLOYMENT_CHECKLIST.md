## Netlify + Railway Deployment Checklist

### 1) Deploy Backend (Railway)
- Create a Railway project from this repo.
- Ensure backend service uses repo root with `railway.json`.
- Set required env vars:
  - `NODE_ENV=production`
  - `JWT_SECRET`, `JWT_EXPIRE`
  - `CLIENT_URL`, `CLIENT_URLS`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `DB_SSL` (`false` or `true`)
  - SMTP / bKash vars if used.
- Deploy backend.

### 2) Run DB Migrations (Railway)
- After first backend deploy, run migration command in Railway service shell:
  - `npm -C server run migrate:prod`

### 3) Deploy Frontend (Netlify)
- Import repo in Netlify.
- Settings:
  - Base directory: `client`
  - Build command: `CI= npm run build`
  - Publish directory: `build`
- Set env var:
  - `REACT_APP_API_URL=https://<your-railway-service>.up.railway.app/api`
- Deploy.

### 4) Post-Deploy Verification
- Check health endpoint:
  - `https://<your-railway-service>.up.railway.app/api/health`
- Test login/register/password reset.
- Test appointment, notifications, medicine reminder, and lab flow.
