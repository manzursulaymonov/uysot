@echo off
echo ========================================
echo   UYSOT — Shartnomalar CRM
echo   http://localhost:3000
echo ========================================
echo.
echo Brauzer ochilmoqda...
timeout /t 2 /nobreak >nul
start http://localhost:3000
npx -y serve . -p 3000 -s
pause
