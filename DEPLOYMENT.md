# Ram Infosys Employee Portal — Deployment Guide

Complete deployment setup for **both frontend and backend** to Render using Docker.

---

## 📋 Project Structure

```
Ram-infosys/
├── server.js                 # Express.js backend
├── db.js                     # MySQL connection
├── schema.sql                # Database schema
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
├── docker-compose.yml       # Local orchestration
├── nginx.conf               # Nginx configuration
└── .env.example             # Environment template
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (or use Docker)

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

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=ram_user
DB_PASSWORD=ram_password
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
- **MySQL**: `localhost:3306`
- **Backend**: `http://localhost:4000`
- **Frontend**: `http://localhost:3000`

### 4. Access the Portal

- **Employee Portal**: http://localhost:3000
  - Demo: `EMP001` / `pass@123`
- **HR Dashboard**: http://localhost:3000
  - Demo: hr@raminfosys.in / `hr@Admin2024`

---

## 🌐 Deploy to Render

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Ram Infosys Portal with Docker"
git remote add origin https://github.com/YOUR_USERNAME/RAM-INFOSYS.git
git branch -M main
git push -u origin main
```

### Step 2: Create MySQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Database** → **MySQL**
3. Configure:
   - **Name**: `ram-infosys-db`
   - **Region**: Choose your region
   - **MySQL Version**: 8.0
4. Click **Create Database**
5. Copy the internal connection string (e.g., `mysql://user:pass@...`)

### Step 3: Deploy Backend (Node.js API)

1. In Render Dashboard, click **New +** → **Web Service**
2. Select your GitHub repository
3. Configure:
   - **Name**: `ram-infosys-api`
   - **Environment**: `Docker`
   - **Region**: Same as database
   - **Plan**: Free (or Starter for production)
4. Under **Advanced**, add **Environment Variables**:

```env
NODE_ENV=production
PORT=4000
DB_HOST=<mysql-host-from-connection-string>
DB_PORT=3306
DB_USER=<mysql-user>
DB_PASSWORD=<mysql-password>
DB_NAME=ram_infosys
FRONTEND_URL=https://ram-infosys-portal.onrender.com
```

5. Click **Create Web Service**
6. Wait for deployment. Copy the service URL (e.g., `https://ram-infosys-api.onrender.com`)

### Step 4: Deploy Frontend (React + Nginx)

1. In Render Dashboard, click **New +** → **Web Service**
2. Select your GitHub repository again
3. Configure:
   - **Name**: `ram-infosys-portal`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.frontend`
   - **Region**: Same as backend
4. Under **Advanced**, add **Environment Variables**:

```env
VITE_API_URL=https://ram-infosys-api.onrender.com/api
```

5. Click **Create Web Service**
6. Wait for deployment (takes 2-3 min)

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

## 🗄️ Initialize Database Schema

After MySQL is running, load the schema:

```bash
# Via Docker (if using docker-compose locally)
docker exec ram-infosys-db mysql -u root -pram_password ram_infosys < schema.sql

# Or manually via Render MySQL UI
# Copy schema.sql content into Render's SQL editor
```

---

## 🔐 Production Checklist

- [ ] Database credentials stored securely (use Render environment variables)
- [ ] `FRONTEND_URL` updated to production URL
- [ ] `VITE_API_URL` points to production backend
- [ ] HTTPS enabled (automatic on Render)
- [ ] Database backups enabled
- [ ] Monitor logs for errors (Render dashboard)
- [ ] Set up monitoring/alerts if needed

---

## 📝 Environment Variables Summary

### Backend (`server.js`)
| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `4000` | Server port |
| `DB_HOST` | `mysql.render.com` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `ram_user` | Database username |
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
- Check `VITE_API_URL` matches backend URL
- Ensure backend service is running and healthy
- Check Render logs for backend errors

### Database Connection Error
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in environment variables
- Check MySQL service is running on Render
- Ensure schema is loaded: [Load Schema](#initialize-database-schema)

### CORS Issues
- Update `FRONTEND_URL` in backend env vars
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
- **MySQL**: `mysql:8.0` (database)

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Docker Docs](https://docs.docker.com)
- [Express.js Guide](https://expressjs.com)
- [React + Vite Guide](https://vitejs.dev/guide)

---

## 📞 Support

For issues:
1. Check Render **Logs** tab
2. Review Docker output
3. Check environment variables are set correctly
4. Verify database connectivity

---

**Deployment Status**: Ready for Production ✅
