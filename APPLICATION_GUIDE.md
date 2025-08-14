# Academia LMS - Complete Application Guide

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js** (v14 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **Git** (optional) - For version control
3. **Web Browser** - Chrome, Firefox, Safari, or Edge

### 🔧 Installation & Setup

#### 1. Install Dependencies
```bash
# Navigate to backend directory
cd backend

# Install all required packages
npm install

# Verify installation
npm list
```

#### 2. Start the Application
```bash
# From the backend directory
npm start
# OR
node server.js
```

#### 3. Access the Application
- **Backend API**: http://localhost:5000/api
- **Frontend**: Open `frontend/html/login.html` in your browser
- **API Documentation**: http://localhost:5000/api

## 📁 Project Structure

```
academia/
├── 📁 backend/                    # Server-side application
│   ├── 📁 config/                 # Configuration files
│   │   └── db.js                  # Database connection
│   ├── 📁 controllers/            # Business logic
│   │   ├── authController.js      # Authentication logic
│   │   ├── courseController.js    # Course management
│   │   ├── lecturerController.js  # Lecturer functionality
│   │   ├── notificationController.js # Notification system
│   │   ├── presentationController.js # Presentation management
│   │   └── studentController.js   # Student functionality
│   ├── 📁 middleware/             # Custom middleware
│   │   ├── authMiddleware.js      # Authentication & security
│   │   └── errorMiddleware.js     # Error handling
│   ├── 📁 models/                 # Database schemas
│   │   ├── courseModel.js         # Course data structure
│   │   ├── evaluationModel.js     # Evaluation/grading system
│   │   ├── notificationModel.js   # Notification data
│   │   ├── presentationModel.js   # Presentation data
│   │   └── userModel.js           # User data (students/lecturers)
│   ├── 📁 routes/                 # API endpoints
│   │   ├── authRoutes.js          # Authentication routes
│   │   ├── courseRoutes.js        # Course routes
│   │   ├── lecturerRoutes.js      # Lecturer routes
│   │   ├── notificationRoutes.js  # Notification routes
│   │   ├── presentationRoutes.js  # Presentation routes
│   │   └── studentRoutes.js       # Student routes
│   ├── 📁 uploads/                # File storage directory
│   ├── .env                       # Environment variables
│   ├── package.json               # Dependencies & scripts
│   ├── server.js                  # Main server file
│   └── cleanup-mock-data.js       # Production cleanup script
│
├── 📁 frontend/                   # Client-side application
│   ├── 📁 css/                    # Stylesheets
│   │   ├── style.css              # Main styles
│   │   ├── dashboard.css          # Dashboard specific styles
│   │   └── presentations.css      # Presentation styles
│   ├── 📁 js/                     # JavaScript modules
│   │   ├── auth.js                # Authentication handling
│   │   ├── dashboard.js           # General dashboard functionality
│   │   ├── presentation.js        # Presentation viewer
│   │   ├── utils.js               # Utility functions
│   │   ├── 📁 student/            # Student-specific scripts
│   │   │   ├── student-courses.js
│   │   │   ├── student-dashboard.js
│   │   │   ├── student-presentations.js
│   │   │   ├── student-profile.js
│   │   │   └── student-notifications.js
│   │   └── 📁 lecturer/           # Lecturer-specific scripts
│   │       ├── lecturer-courses.js
│   │       ├── lecturer-dashboard.js
│   │       ├── lecturer-presentations.js
│   │       └── lecturer-profile.js
│   ├── 📁 html/                   # HTML pages
│   │   ├── login.html             # Login & Registration page
│   │   ├── 📁 student/            # Student pages
│   │   │   ├── dashboard.html
│   │   │   ├── courses.html
│   │   │   ├── presentations.html
│   │   │   ├── assignments.html
│   │   │   ├── calendar.html
│   │   │   ├── profile.html
│   │   │   └── settings.html
│   │   └── 📁 lecturer/           # Lecturer pages
│   │       ├── dashboard.html
│   │       ├── courses.html
│   │       ├── manage-courses.html
│   │       ├── presentations.html
│   │       ├── evaluation.html
│   │       ├── assignments.html
│   │       ├── calendar.html
│   │       ├── profile.html
│   │       └── settings.html
│   └── 📁 assets/                 # Static assets
│       ├── favicon.ico            # Website icon
│       └── README.md              # Assets documentation
│
├── 📁 docs/                       # Documentation
├── .gitignore                     # Git ignore rules
├── README.md                      # Main documentation
└── DESIGN_SYSTEM.md               # UI/UX guidelines
```

## 🔐 Default Accounts

The application includes test accounts for immediate use:

### Student Account
- **Email**: `stu111@example.com`
- **Password**: `password123`
- **Student ID**: `STU111`

### Lecturer Account
- **Email**: `shanx@example.com`
- **Password**: `password123`
- **Employee ID**: `EMP001`

## 🌐 Can Your Friends Use This Application?

### ✅ YES! Here's how:

#### Option 1: Local Network Access
1. **Start the server** on your computer
2. **Find your IP address**:
   - Windows: `ipconfig` in Command Prompt
   - Mac/Linux: `ifconfig` in Terminal
3. **Share your IP** with friends: `http://YOUR_IP:5000`
4. **Friends access**: They open `http://YOUR_IP:5000/html/login.html`

#### Option 2: Cloud Deployment (Recommended)
Deploy to platforms like:
- **Heroku** (Free tier available)
- **Vercel** (Free for personal projects)
- **Netlify** (Frontend) + **Railway** (Backend)
- **DigitalOcean** (Professional hosting)

#### Option 3: Share Project Files
1. **ZIP the entire `academia` folder**
2. **Send to friends**
3. **They follow the installation steps** above
4. **Each person runs their own instance**

## 🚦 Running the Application

### Method 1: Manual Start (Recommended)
```bash
# Navigate to backend
cd backend

# Start server
node server.js
```

### Method 2: Using npm Scripts
```bash
# Navigate to backend
cd backend

# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Method 3: Using Batch Files (Windows)
```bash
# Double-click these files:
start-server.bat      # Starts backend server
start-frontend.bat    # Opens frontend in browser
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (MongoDB Atlas - Cloud)
MONGO_URI=mongodb+srv://hashanprabboth:joJsyByBQJD6MroR@cluster0.fx1he1t.mongodb.net/academia_lms

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🎯 Key Features

### For Students
- ✅ Course enrollment and management
- ✅ View presentations and materials
- ✅ Submit assignments
- ✅ Track grades and progress
- ✅ Receive notifications
- ✅ Personal dashboard

### For Lecturers
- ✅ Create and manage courses
- ✅ Upload presentations and materials
- ✅ Create assignments and evaluate submissions
- ✅ Send notifications to students
- ✅ View student progress
- ✅ Course analytics

### System Features
- ✅ Secure authentication (JWT)
- ✅ Role-based access control
- ✅ Cloud database (MongoDB Atlas)
- ✅ Real-time notifications
- ✅ Responsive design
- ✅ File upload support

## 🐛 Troubleshooting

### Common Issues

#### "Port already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

#### "Cannot connect to database"
- Check internet connection (using cloud MongoDB)
- Verify `.env` file exists and has correct `MONGO_URI`

#### "Module not found"
```bash
cd backend
npm install
```

#### "Frontend not loading"
- Ensure server is running on port 5000
- Open browser to: `http://localhost:5000/html/login.html`

## 📱 Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🚀 Deployment Ready
The application is configured for easy deployment with:
- Environment-based configuration
- Production error handling
- Security middleware
- Cloud database integration

## 📧 Support
For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md file
3. Check browser console for error messages
4. Ensure all dependencies are installed

---
**Built with ❤️ for educational excellence**
