# Academia LMS - Learning Management System

A comprehensive Learning Management System built for educational institutions to manage courses, students, lecturers, and academic evaluations.

## 🚀 Features

### For Students
- **Dashboard**: Overview of enrolled courses, assignments, grades, and upcoming deadlines
- **Course Management**: Browse, enroll, and access course materials
- **Assignment Submission**: Submit assignments with file attachments
- **Grade Tracking**: View grades and feedback from lecturers
- **Profile Management**: Update personal information and academic details

### For Lecturers
- **Course Creation**: Create and manage courses with detailed curriculum
- **Student Management**: Track student enrollment and progress
- **Assignment Creation**: Create assignments with due dates and grading rubrics
- **Evaluation System**: Grade submissions with detailed feedback
- **Analytics**: View course statistics and student performance

### System Features
- **Authentication**: Secure login system with JWT tokens
- **Role-based Access**: Different interfaces for students and lecturers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live notifications and updates
- **File Management**: Upload and manage course materials and assignments

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox/Grid and responsive design
- **JavaScript (ES6+)**: Interactive functionality and API integration
- **Local Storage**: Client-side data persistence

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing and security

## 📁 Project Structure

```
academia-lms/
│
├── frontend/                 # Client-side application
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── auth.js          # Authentication logic
│   │   ├── dashboard.js     # Dashboard functionality
│   │   └── presentation.js  # Presentation/slideshow features
│   ├── html/
│   │   ├── login.html       # Login page
│   │   ├── student/         # Student-specific pages
│   │   │   ├── dashboard.html
│   │   │   ├── courses.html
│   │   │   └── profile.html
│   │   └── lecturer/        # Lecturer-specific pages
│   │       ├── dashboard.html
│   │       ├── manage-courses.html
│   │       └── evaluation.html
│   └── assets/              # Images, icons, and other assets
│
├── backend/                 # Server-side application
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   └── lecturerController.js
│   ├── models/              # Database schemas
│   │   ├── userModel.js
│   │   ├── courseModel.js
│   │   └── evaluationModel.js
│   ├── routes/              # API endpoints
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   └── lecturerRoutes.js
│   ├── middleware/          # Custom middleware
│   │   └── authMiddleware.js
│   ├── config/              # Configuration files
│   │   └── db.js
│   ├── server.js            # Main server file
│   └── .env                 # Environment variables
│
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Internet connection (for MongoDB Atlas database)

### Quick Start (Easiest Way)

#### Windows Users:
1. **Double-click** `start-app.bat` OR `start-app.ps1`
2. **Wait for setup** to complete automatically
3. **Open browser** to: `http://localhost:5000/html/login.html`

#### Manual Installation:

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start the development server**
   ```bash
   # From the backend directory
   node server.js
   ```

3. **Access the application**
   - API: `http://localhost:5000/api`
   - Frontend: `http://localhost:5000/html/login.html`

## 🔐 Demo Accounts

**Student Account:**
- Email: `stu111@example.com`
- Password: `password123`
- Student ID: `STU111`

**Lecturer Account:**
- Email: `shanx@example.com`
- Password: `password123`
- Employee ID: `EMP001`

## 🌐 Can Friends Use This App?

**YES!** Here's how:

### Option 1: Share Locally (Same Network)
1. Start the app on your computer
2. Find your IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Friends visit: `http://YOUR_IP:5000/html/login.html`

### Option 2: Cloud Deployment
Deploy to platforms like:
- **Heroku** (Free tier)
- **Vercel** + **Railway**
- **Netlify** + **MongoDB Atlas**

### Option 3: Share Project Files
1. ZIP the entire `academia` folder
2. Send to friends
3. They follow the installation steps
4. Each runs their own instance

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Student Endpoints
- `GET /api/student/dashboard` - Get dashboard data
- `GET /api/student/courses` - Get enrolled courses
- `GET /api/student/grades` - Get student grades

### Lecturer Endpoints
- `GET /api/lecturer/dashboard` - Get dashboard data
- `GET /api/lecturer/courses` - Get managed courses
- `POST /api/lecturer/courses` - Create new course
- `GET /api/lecturer/evaluations` - Get pending evaluations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built for educational excellence** 🎓