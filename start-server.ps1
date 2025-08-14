#!/usr/bin/env pwsh

Write-Host "Starting Academia LMS Backend Server..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location "C:\Users\PRABO\OneDrive\Desktop\appAcademia\academia\backend"

Write-Host "Current directory: $PWD" -ForegroundColor Yellow
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules found" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules not found, running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Starting server on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
node server.js
