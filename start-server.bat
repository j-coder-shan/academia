@echo off
echo Starting Academia LMS Backend Server...
echo.
cd /d "c:\Users\PRABO\OneDrive\Desktop\appAcademia\academia\backend"
echo Current directory: %CD%
echo.
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
node server.js
pause
