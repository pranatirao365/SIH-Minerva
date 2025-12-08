@echo off
echo ==========================================
echo  Miner Call Center - Toll-Free Server
echo ==========================================
echo.
echo Starting server on port 5000...
echo.

cd "%~dp0Toll free"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Server is starting...
echo.
echo Access endpoints:
echo   - Voice Test: http://localhost:5000/voice-test
echo   - Alert API:  http://localhost:5000/alert
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js
