@echo off
title CyberRiskOS One-Click Launcher
echo ===================================================
echo   CyberRiskOS Full Stack Launcher
echo ===================================================
echo.
echo [1/3] Starting Python Risk Engine (Port 8000)...
start "Python Risk Engine (Port 8000)" cmd /k "cd /d %~dp0risk-engine && .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Express API Gateway (Port 5000)...
start "Express API Gateway (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Vite Frontend UI (Port 3000)...
start "Vite Frontend UI (Port 3000)" cmd /k "cd /d %~dp0frontend && npx vite --host 0.0.0.0 --port 3000"

echo.
echo ===================================================
echo   All CyberRiskOS Services Started Successfully!
echo   - Frontend UI:  http://localhost:3000
echo   - API Gateway:  http://localhost:5000
echo   - Risk Engine:  http://127.0.0.1:8000
echo ===================================================
pause
