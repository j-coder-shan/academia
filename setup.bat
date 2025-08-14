@echo off
echo 🎓 Setting up Academia LMS...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Navigate to backend directory
cd backend

echo 📦 Installing backend dependencies...
npm install express mongoose dotenv cors colors bcryptjs jsonwebtoken express-async-handler multer

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.
echo 🚀 Starting the server...
echo 📡 Remote MongoDB database configured
echo 🌐 Server will be available at: http://localhost:5000
echo 🎯 API endpoints at: http://localhost:5000/api
echo.
echo Demo Accounts:
echo 👨‍🎓 Student: student@demo.com / demo123
echo 👩‍🏫 Lecturer: lecturer@demo.com / demo123
echo.

node server.js
