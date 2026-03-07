@echo off
echo Starting Dental Management System...

echo Starting Backend...
cd "%~dp0backend"
start cmd /k ".\venv\Scripts\Activate.bat & uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend...
cd "%~dp0frontend"
start cmd /k "npm run dev"

echo Both services are starting in new windows!
echo Backend API available at: http://127.0.0.1:8000
echo Frontend Application available at: http://127.0.0.1:5173
pause
