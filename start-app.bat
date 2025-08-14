@echo off
chcp 65001 >nul
cls
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     🎓 Academia LMS - Startup               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Set project paths
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

echo [INFO] Project directory: %PROJECT_ROOT%
echo.

REM Check if we're in the right directory structure
echo [1/6] 🔍 Validating project structure...
if not exist "%BACKEND_DIR%" (
    echo ❌ Error: Backend directory not found
    echo Expected: %BACKEND_DIR%
    goto :error_exit
)

if not exist "%FRONTEND_DIR%" (
    echo ❌ Error: Frontend directory not found  
    echo Expected: %FRONTEND_DIR%
    goto :error_exit
)

if not exist "%FRONTEND_DIR%\html\login.html" (
    echo ❌ Error: Frontend HTML files not found
    echo Expected: %FRONTEND_DIR%\html\login.html
    goto :error_exit
)

echo ✅ Project structure validated
echo.

REM Check Node.js installation
echo [2/6] 🔍 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo 📥 Please install Node.js from https://nodejs.org/
    echo 💡 Make sure to restart your terminal after installation
    goto :error_exit
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% installed
echo ✅ npm %NPM_VERSION% installed
echo.

REM Kill any existing processes on port 5000
echo [3/6] 🔪 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5000') do (
    echo 🔪 Killing process %%a on port 5000...
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ Port 5000 cleaned
echo.

REM Navigate to backend and handle dependencies
echo [4/6] 📦 Managing dependencies...
cd /d "%BACKEND_DIR%"

if not exist "package.json" (
    echo 📝 Creating package.json...
    echo { > package.json
    echo   "name": "academia-lms-backend", >> package.json
    echo   "version": "1.0.0", >> package.json
    echo   "description": "Academia LMS Backend Server", >> package.json
    echo   "main": "server.js", >> package.json
    echo   "scripts": { >> package.json
    echo     "start": "node server.js", >> package.json
    echo     "dev": "nodemon server.js" >> package.json
    echo   }, >> package.json
    echo   "dependencies": {} >> package.json
    echo } >> package.json
)

REM Install required dependencies with explicit call
echo 📦 Installing/updating dependencies...
call npm install express mongoose cors bcryptjs jsonwebtoken multer path dotenv --save
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Failed to install dependencies
    echo 💡 Try running: npm cache clean --force
    goto :error_exit
)
echo ✅ Dependencies installed successfully
echo.

REM Create/Update server.js with FIXED static file serving - FIXED LINE BY LINE METHOD
echo [5/6] 🔧 Creating/updating server.js...

REM Delete corrupted server.js first
if exist "server.js" del "server.js"

REM Create clean server.js file line by line (NO PARENTHESES)
echo const express = require('express'); > server.js
echo const mongoose = require('mongoose'); >> server.js
echo const cors = require('cors'); >> server.js
echo const path = require('path'); >> server.js
echo. >> server.js
echo const app = express(); >> server.js
echo const PORT = process.env.PORT ^|^| 5000; >> server.js
echo. >> server.js
echo // Enhanced middleware >> server.js
echo app.use(cors()); >> server.js
echo app.use(express.json({ limit: '50mb' })); >> server.js
echo app.use(express.urlencoded({ extended: true, limit: '50mb' })); >> server.js
echo. >> server.js
echo // CRITICAL FIX: Serve static files from frontend directory >> server.js
echo app.use(express.static(path.join(__dirname, '..', 'frontend'))); >> server.js
echo. >> server.js
echo // Enhanced logging middleware >> server.js
echo app.use((req, res, next) =^> { >> server.js
echo     const timestamp = new Date().toISOString(); >> server.js
echo     console.log(timestamp + ' - ' + req.method + ' ' + req.path); >> server.js
echo     next(); >> server.js
echo }); >> server.js
echo. >> server.js
echo // MongoDB connection with better error handling >> server.js
echo const MONGO_URI = process.env.MONGO_URI ^|^| 'mongodb://localhost:27017/academia-lms'; >> server.js
echo. >> server.js
echo mongoose.connect(MONGO_URI) >> server.js
echo     .then(() =^> console.log('✅ Connected to MongoDB')) >> server.js
echo     .catch(err =^> { >> server.js
echo         console.error('❌ MongoDB connection error:', err.message); >> server.js
echo         console.log('💡 Using offline mode - some features may be limited'); >> server.js
echo     }); >> server.js
echo. >> server.js
echo // API Documentation endpoint >> server.js
echo app.get('/api/docs', (req, res) =^> { >> server.js
echo     res.json({ >> server.js
echo         message: 'Academia LMS API', >> server.js
echo         version: '1.0.0', >> server.js
echo         status: 'running', >> server.js
echo         timestamp: new Date().toISOString(), >> server.js
echo         endpoints: { >> server.js
echo             auth: '/api/auth', >> server.js
echo             student: '/api/student', >> server.js
echo             lecturer: '/api/lecturer', >> server.js
echo             courses: '/api/courses', >> server.js
echo             presentations: '/api/presentations', >> server.js
echo             notifications: '/api/notifications' >> server.js
echo         }, >> server.js
echo         frontend: { >> server.js
echo             login: '/html/login.html', >> server.js
echo             register: '/html/register.html', >> server.js
echo             studentDashboard: '/html/student/dashboard.html', >> server.js
echo             lecturerDashboard: '/html/lecturer/dashboard.html' >> server.js
echo         } >> server.js
echo     }); >> server.js
echo }); >> server.js
echo. >> server.js
echo // Health check endpoint >> server.js
echo app.get('/api/health', (req, res) =^> { >> server.js
echo     res.json({ >> server.js
echo         status: 'healthy', >> server.js
echo         timestamp: new Date().toISOString(), >> server.js
echo         uptime: process.uptime(), >> server.js
echo         mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' >> server.js
echo     }); >> server.js
echo }); >> server.js
echo. >> server.js
echo // Serve login page at root >> server.js
echo app.get('/', (req, res) =^> { >> server.js
echo     res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html')); >> server.js
echo }); >> server.js
echo. >> server.js
echo // Handle SPA routes and serve static files properly >> server.js
echo app.get('*', (req, res) =^> { >> server.js
echo     // If it's an API route, return 404 >> server.js
echo     if (req.path.startsWith('/api/')) { >> server.js
echo         return res.status(404).json({ >> server.js
echo             error: 'API endpoint not found', >> server.js
echo             path: req.path, >> server.js
echo             available: '/api/docs' >> server.js
echo         }); >> server.js
echo     } >> server.js
echo     // For HTML pages, serve login.html as fallback >> server.js
echo     res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html')); >> server.js
echo }); >> server.js
echo. >> server.js
echo // Enhanced server startup >> server.js
echo app.listen(PORT, () =^> { >> server.js
echo     console.log('╔══════════════════════════════════════════════════════════════╗'); >> server.js
echo     console.log('║                🚀 Academia LMS Server Started               ║'); >> server.js
echo     console.log('╚══════════════════════════════════════════════════════════════╝'); >> server.js
echo     console.log(); >> server.js
echo     console.log('📱 Main Application:     http://localhost:' + PORT); >> server.js
echo     console.log('🔐 Login Page:           http://localhost:' + PORT + '/html/login.html'); >> server.js
echo     console.log('📝 Register Page:        http://localhost:' + PORT + '/html/register.html'); >> server.js
echo     console.log('👨‍🎓 Student Dashboard:    http://localhost:' + PORT + '/html/student/dashboard.html'); >> server.js
echo     console.log('👨‍🏫 Lecturer Dashboard:   http://localhost:' + PORT + '/html/lecturer/dashboard.html'); >> server.js
echo     console.log('📚 API Documentation:    http://localhost:' + PORT + '/api/docs'); >> server.js
echo     console.log('💚 Health Check:         http://localhost:' + PORT + '/api/health'); >> server.js
echo     console.log(); >> server.js
echo     console.log('🛑 Press Ctrl+C to stop the server'); >> server.js
echo     console.log('═══════════════════════════════════════════════════════════════'); >> server.js
echo }); >> server.js
echo. >> server.js
echo // Graceful shutdown >> server.js
echo process.on('SIGINT', () =^> { >> server.js
echo     console.log('\n🛑 Shutting down gracefully...'); >> server.js
echo     mongoose.connection.close(() =^> { >> server.js
echo         console.log('✅ MongoDB connection closed'); >> server.js
echo         process.exit(0); >> server.js
echo     }); >> server.js
echo }); >> server.js

echo ✅ server.js created/updated with STATIC FILE SERVING FIX
echo.

REM Start the server with enhanced output
echo [6/6] 🚀 Starting Academia LMS server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎓 Academia LMS Ready                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Your Academia LMS will be available at:
echo    ➤ Main App:            http://localhost:5000
echo    ➤ Login:               http://localhost:5000/html/login.html
echo    ➤ Register:            http://localhost:5000/html/register.html
echo    ➤ API Documentation:   http://localhost:5000/api/docs
echo    ➤ Health Check:        http://localhost:5000/api/health
echo.
echo 📁 Static files served from: %FRONTEND_DIR%
echo 🗄️  Backend running from:   %BACKEND_DIR%
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Server starting... (This window will show server logs)     ║
echo ║  Press Ctrl+C to stop the server                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Start the Node.js server
node server.js

REM If we reach here, server has stopped
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   🛑 Server Stopped                         ║
echo ╚══════════════════════════════════════════════════════════════╝
goto :end

:error_exit
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     ❌ Startup Failed                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 💡 Troubleshooting tips:
echo    1. Make sure you're running this from the academia folder
echo    2. Install Node.js from https://nodejs.org/
echo    3. Check your internet connection for npm install
echo    4. Try running as Administrator
echo.
pause
exit /b 1

:end
echo 👋 Thanks for using Academia LMS!
pause