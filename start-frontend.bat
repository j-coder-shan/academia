@echo off
echo Starting Academia LMS Frontend Server...
echo.
echo Frontend will be available at: http://localhost:8080
echo Backend should be running at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "c:\Users\PRABO\OneDrive\Desktop\appAcademia\academia\frontend"
python -m http.server 8080
