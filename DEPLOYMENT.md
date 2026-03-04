# Ram Infosys Employee Portal — Deployment Guide

Complete deployment setup for **both frontend and backend** to Render using Docker + PostgreSQL.

---

## 📋 Project Structure

```
Ram-infosys/
├── server.js                 # Express.js backend
├── db.js                     # PostgreSQL connection
├── schema.sql                # Database schema (PostgreSQL)
├── package.json              # Backend dependencies
├── Dockerfile.backend        # Backend container
│
├── client/                   # React frontend
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   └── main.jsx         # React entry point
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   └── dist/                # Built files (generated)
│
├── Dockerfile.frontend      # Frontend (Nginx) container
├── docker-compose.yml       # Local orchestration (PostgreSQL)
├── nginx.conf               # Nginx configuration
└── .env.example             # Environment template
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

### 1. Clone & Install Dependencies

```bash
cd d:\Ram-infosys
npm install
cd client && npm install && cd ..
```

### 2. Create `.env` File

```bash
# Backend
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ram_infosys

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:4000/api
```

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL**: `localhost:5432`
- **Backend**: `http://localhost:4000`
- **Frontend**: `http://localhost:3000`

### 4. Access the Portal

- **Employee Portal**: http://localhost:3000
  - Demo: `EMP001` / `pass@123`
- **HR Dashboard**: http://localhost:3000
  - Demo: hr@raminfosys.in / `hr@Admin2024`

---

## 🌐 Deploy to Render

Render automatically provides a PostgreSQL database service, making deployment seamless!

### Step 1: Push Code to GitHub ✅ (Already done!)

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Postgres** (not MySQL)
3. Configure:
   - **Name**: `ram-infosys-db`
   - **Database**: `ram_infosys`
   - **User**: `postgres`
   - **Region**: Choose your region (US East recommended)
4. Click **Create Database**
5. **Important**: Copy the **Internal Database URL** (looks like `postgresql://user:pass@dpg-....internal:5432/ram_infosys`)

### Step 3: Deploy Backend (Node.js API)

1. In Render Dashboard, click **New +** → **Web Service**
2. Select `Ragul-ceo/ram-infosys` repository
3. Configure:
   - **Name**: `ram-infosys-api`
   - **Environment**: `Docker`
   - **Dockerfile Path**: (leave blank, will auto-detect)
   - **Plan**: Free (or Starter for production)
4. **Advanced** → Add **Environment Variables**:

```env
NODE_ENV=production
PORT=4000
DB_HOST=<postgres-host-from-internal-url>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<postgres-password-from-url>
DB_NAME=ram_infosys
FRONTEND_URL=https://ram-infosys-portal.onrender.com
```

5. Click **Create Web Service**
6. Wait ~5 min for build. Copy the service URL (e.g., `https://ram-infosys-api.onrender.com`)

### Step 4: Deploy Frontend (React + Nginx)

1. In Render Dashboard, click **New +** → **Web Service**
2. Select `Ragul-ceo/ram-infosys` repository
3. Configure:
   - **Name**: `ram-infosys-portal`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.frontend`
4. **Advanced** → Add **Environment Variables**:

```env
VITE_API_URL=https://ram-infosys-api.onrender.com/api
```

5. Click **Create Web Service**
6. Wait 2-3 min for deployment

### 5. Initialize Database Schema

Once PostgreSQL is running:

1. Go to your PostgreSQL database on Render
2. Click the **Connect** button
3. Use the connection info to run:

```bash
psql postgresql://postgres:PASSWORD@HOST:5432/ram_infosys < schema.sql
```

Or copy the schema.sql content and paste into Render's SQL editor.

---

## ✅ Verify Deployment

### Backend Health Check

```bash
curl https://ram-infosys-api.onrender.com/health
# Expected: { "status": "ok", "time": "..." }
```

### Frontend Access

Open in browser: `https://ram-infosys-portal.onrender.com`

If you see the login page, deployment is successful! ✨

---

## 🔐 Production Checklist

- [ ] Database credentials stored as environment variables (do NOT commit .env)
- [ ] `FRONTEND_URL` updated to production URL
- [ ] `VITE_API_URL` points to production backend
- [ ] HTTPS enabled (automatic on Render)
- [ ] Database backups enabled (Render feature)
- [ ] Monitor logs for errors (Render dashboard)
- [ ] Test login with demo credentials

---

## 📝 Environment Variables Summary

### Backend (`server.js`)
| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `4000` | Server port |
| `DB_HOST` | `dpg-....internal` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `...` | Database password |
| `DB_NAME` | `ram_infosys` | Database name |
| `FRONTEND_URL` | `https://...onrender.com` | CORS origin |

### Frontend (`App.jsx`)
| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `https://.../api` | Backend API endpoint |

---

## 🐛 Troubleshooting

### API Connection Error
- Check `VITE_API_URL` matches backend URL in frontend env vars
- Ensure backend service is running and healthy
- Check Render logs for backend errors: Dashboard → Backend Service → Logs

### Database Connection Error
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in backend env vars
- Check PostgreSQL service is running on Render
- Ensure schema is loaded into the database
- Try connecting directly using Render's connection info

### CORS Issues
- Update `FRONTEND_URL` in backend environment variables
- Verify Nginx proxy config (`nginx.conf`) is correct

### Port Conflicts (Local)
```bash
# Change port in .env and docker-compose.yml
docker-compose down
docker-compose up -d
```

---

## 📦 Docker Images Used

- **Node.js**: `node:18-alpine` (lightweight)
- **Nginx**: `nginx:alpine` (frontend serving)
- **PostgreSQL**: `postgres:15-alpine` (database)

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Docker Docs](https://docs.docker.com)
- [Express.js Guide](https://expressjs.com)
- [React + Vite Guide](https://vitejs.dev/guide)

---

## 📞 Support

For issues:
1. Check Render **Logs** tab for each service
2. Review environment variables are set correctly
3. Verify database credentials and connectivity
4. Check CORS headers in browser DevTools

---

**Deployment Status**: Ready for Production with PostgreSQL ✅
