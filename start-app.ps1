# Academia LMS - Quick Start Script
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Academia LMS - Quick Start" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\server.js")) {
    Write-Host "Error: Please run this script from the academia root directory" -ForegroundColor Red
    Write-Host "Expected structure: academia\start-app.ps1" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Checking Node.js installation..." -ForegroundColor Green
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Node.js is installed ($nodeVersion)" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Installing/checking dependencies..." -ForegroundColor Green
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Starting the server..." -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Server Starting..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5000/api" -ForegroundColor Blue
Write-Host "Frontend:   " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5000/html/login.html" -ForegroundColor Blue
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "Student:  stu111@example.com / password123" -ForegroundColor Cyan
Write-Host "Lecturer: shanx@example.com / password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node server.js
