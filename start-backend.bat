@echo off
echo Starting MedLegal Backend Server...
echo.
cd backend
echo Installing dependencies if needed...
call npm install
echo.
echo Starting server...
call npm run dev
pause