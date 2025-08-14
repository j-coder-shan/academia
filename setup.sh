#!/bin/bash

# Academia LMS Setup Script

echo "🎓 Setting up Academia LMS..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Navigate to backend directory
cd backend

echo "📦 Installing backend dependencies..."
npm install express mongoose dotenv cors colors bcryptjs jsonwebtoken express-async-handler multer

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🚀 Starting the server..."
echo "📡 Remote MongoDB database configured"
echo "🌐 Server will be available at: http://localhost:5000"
echo "🎯 API endpoints at: http://localhost:5000/api"
echo ""
echo "Demo Accounts:"
echo "👨‍🎓 Student: student@demo.com / demo123"
echo "👩‍🏫 Lecturer: lecturer@demo.com / demo123"
echo ""

node server.js
