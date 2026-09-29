# CyberRiskOS Cloud Deployment Guide

CyberRiskOS is designed with a modern microservice architecture:
1. **Frontend UI**: React + Vite + Tailwind CSS Single Page Application
2. **Backend API Gateway**: Node.js + Express + TypeScript
3. **Risk Engine**: Python + FastAPI microservice
4. **Authoritative Database**: PostgreSQL 16 (supports managed PostgreSQL or automatic in-memory fallback)

---

## Option 1: Deploy with Render (1-Click Blueprint — Recommended)

Render provides native support for blueprints via the included [`render.yaml`](./render.yaml), which automatically provisions the database and all 3 services in one action.

### Step-by-Step Instructions:

1. **Push your code to GitHub**:
   Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: configure cloud deployment blueprints"
   git push origin main
   ```

2. **Open Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and log in (or sign up with GitHub).

3. **Deploy the Blueprint**:
   - Click **New +** in the top navigation bar.
   - Select **Blueprint**.
   - Connect your GitHub repository (`CYBER-Security-`).
   - Render will automatically detect `render.yaml` and display the plan:
     - 🗄️ **`cyberriskos-db`** (Managed PostgreSQL)
     - 🐍 **`cyberriskos-risk-engine`** (Python / FastAPI)
     - ⚡ **`cyberriskos-backend`** (Node.js / Express API Gateway)
     - 💻 **`cyberriskos-frontend`** (Static Site / React Dashboard)
   - Click **Apply**.

4. **Verify Deployment**:
   - Wait 3–4 minutes for the services to build and deploy.
   - Once completed, visit your `cyberriskos-frontend` URL (e.g., `https://cyberriskos-frontend.onrender.com`).
   - Your frontend will automatically communicate with the deployed backend API!

---

## Option 2: Deploy with Railway

Railway allows you to deploy multi-service repositories with private internal networking.

### Step-by-Step Instructions:

1. **Sign in to Railway**:
   - Navigate to [railway.app](https://railway.app/) and sign in with your GitHub account.

2. **Create New Project**:
   - Click **New Project** &rarr; **Deploy from GitHub repo**.
   - Select your `CYBER-Security-` repository.

3. **Add Services**:
   - **PostgreSQL Database**:
     - Click **+ New** &rarr; **Database** &rarr; **Add PostgreSQL**.
   
   - **Service 1: Python Risk Engine**:
     - Click **+ New** &rarr; **GitHub Repo** &rarr; select this repository.
     - Go to **Settings**:
       - Root Directory: `risk-engine`
       - Build Command: `pip install -r requirements.txt`
       - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Go to **Networking** &rarr; Generate Domain or enable Private Networking.

   - **Service 2: Backend API Gateway**:
     - Click **+ New** &rarr; **GitHub Repo** &rarr; select this repository.
     - Go to **Settings**:
       - Root Directory: `backend`
       - Build Command: `npm install && npm run build`
       - Start Command: `npm start`
     - Go to **Variables** and add:
       - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
       - `RISK_ENGINE_URL`: Private domain or URL of the Risk Engine (e.g. `http://risk-engine.railway.internal:8000` or public URL)
       - `NODE_ENV`: `production`
       - `JWT_SECRET`: `your-secure-random-secret-key`
       - `ALLOWED_ORIGINS`: `*`
     - Go to **Networking** &rarr; Generate Public Domain (e.g., `https://cyberriskos-backend.up.railway.app`).

   - **Service 3: Frontend UI**:
     - Click **+ New** &rarr; **GitHub Repo** &rarr; select this repository.
     - Go to **Settings**:
       - Root Directory: `frontend`
       - Build Command: `npm install && npm run build`
       - Start Command: `npx serve -s dist -l $PORT`
     - Go to **Variables**:
       - `VITE_API_BASE_URL`: The public domain of your Backend API Gateway (e.g., `https://cyberriskos-backend.up.railway.app`).
     - Go to **Networking** &rarr; Generate Public Domain.

---

## Option 3: Deploy to a Cloud VPS (AWS EC2, DigitalOcean, Ubuntu VM)

If you have a Linux virtual machine, you can run the entire production-grade stack in 1 command using Docker Compose:

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/harshhackathon18-web/CYBER-Security-.git
   cd CYBER-Security-
   ```

3. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**:
   - Frontend UI: `http://<your-server-ip>:3000`
   - Backend API: `http://<your-server-ip>:5000`
