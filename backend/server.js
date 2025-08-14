require('dotenv').config();


const Presentation = require('./models/presentationModel');
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const path = require('path'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import MongoDB Models
const User = require('./models/userModel');
const Course = require('./models/courseModel');
 
const app = express(); 
const PORT = process.env.PORT || 5000; 
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

console.log('🔧 Environment Check:');
console.log('📊 PORT:', PORT);
console.log('🗄️  MongoDB URI:', process.env.MONGO_URI ? 'Found in .env ✅' : 'NOT FOUND ❌');
console.log('🔐 JWT Secret:', JWT_SECRET);
 
// Enhanced middleware with better debugging
app.use(cors({
    origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); 

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

// Add debugging middleware for request body
app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/lecturer/courses')) {
        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📥 Content-Type:', req.headers['content-type']);
        console.log('📥 Body keys:', Object.keys(req.body || {}));
    }
    next();
});

// CRITICAL FIX: Serve static files from frontend directory 
app.use(express.static(path.join(__dirname, '..', 'frontend'))); 
 
// Enhanced logging middleware 
app.use((req, res, next) => { 
    const timestamp = new Date().toISOString(); 
    console.log(timestamp + ' - ' + req.method + ' ' + req.path); 
    next(); 
}); 
 
// MongoDB connection with better error handling 
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/academia-lms'; 
 
mongoose.connect(MONGO_URI) 
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas!');
        console.log('🌐 Database: academia_lms');
    }) 
    .catch(err => { 
        console.error('❌ MongoDB connection error:', err.message); 
        console.log('💡 Using offline mode - some features may be limited'); 
    }); 

console.log('🗃️ Using MongoDB for data persistence');
console.log('📊 Users will be saved to MongoDB Atlas');



// FIXED: Enhanced JWT token verification middleware with better user data
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // FIXED: Fetch complete user data from MongoDB
        const user = await User.findById(decoded.userId, '-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found in database' 
            });
        }

        // FIXED: Attach complete user data to request
        req.user = {
            userId: user._id,
            username: user.name,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.academicInfo?.employeeId,
            studentId: user.academicInfo?.studentId,
            department: user.academicInfo?.department
        };

        console.log('🔍 Token verified for user:', req.user.name, '- Role:', req.user.role);
        next();
    } catch (err) {
        console.error('❌ Token verification error:', err);
        return res.status(403).json({ 
            success: false,
            message: 'Invalid or expired token' 
        });
    }
};

// 🔐 AUTHENTICATION ENDPOINTS - USING MONGODB

// REPLACE the login endpoint (around line 92) with this fixed version:

// MongoDB-based Login endpoint - FIXED to handle studentId
// Enhanced login endpoint - Fix lecturer login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { studentId, lecturerId, employeeId, password, userType, email, username } = req.body;
        
        console.log('🔍 DEBUG - Raw login request body:', req.body);
        
        if (!password) {
            console.log('❌ No password provided');
            return res.status(400).json({ 
                success: false, 
                message: 'Password is required' 
            });
        }

        // 🔧 FIX: Determine the correct identifier based on userType
        let identifier;
        let searchField;
        
        if (userType === 'lecturer') {
            identifier = lecturerId || employeeId || username;
            searchField = lecturerId ? 'academicInfo.employeeId' : 
                         employeeId ? 'academicInfo.employeeId' : 'name';
        } else if (userType === 'student') {
            identifier = studentId || username;
            searchField = studentId ? 'academicInfo.studentId' : 'name';
        } else {
            identifier = email || username || studentId || lecturerId || employeeId;
            searchField = email ? 'email' : 'name';
        }

        console.log('🔍 Login attempt for:', identifier, 'Password provided:', !!password);
        console.log('🔍 Search field:', searchField);
        console.log('🔍 User type:', userType);

        if (!identifier) {
            console.log('❌ Missing credentials - No identifier provided');
            return res.status(400).json({ 
                success: false, 
                message: 'Username/ID is required' 
            });
        }

        // 🔧 FIX: Build the correct search query
        let searchQuery = {};
        if (searchField === 'academicInfo.employeeId') {
            searchQuery['academicInfo.employeeId'] = identifier;
        } else if (searchField === 'academicInfo.studentId') {
            searchQuery['academicInfo.studentId'] = identifier;
        } else if (searchField === 'email') {
            searchQuery.email = identifier.toLowerCase();
        } else {
            searchQuery.name = identifier;
        }

        // Add role filter if userType is specified
        if (userType) {
            searchQuery.role = userType;
        }

        console.log('🔍 Search query:', searchQuery);

        // Find user in database
        const user = await User.findOne(searchQuery);

        if (!user) {
            console.log('❌ User not found with query:', searchQuery);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log('✅ User found:', {
            id: user._id,
            name: user.name,
            role: user.role,
            email: user.email,
            studentId: user.academicInfo?.studentId,
            employeeId: user.academicInfo?.employeeId
        });

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', identifier);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // 🔧 FIX: Create proper JWT token with all necessary fields
        const tokenPayload = {
            id: user._id,
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.academicInfo?.studentId,
            employeeId: user.academicInfo?.employeeId
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        console.log('✅ MongoDB Login successful for:', identifier, '- Role:', user.role);

        // 🔧 FIX: Send proper response with user data
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                academicInfo: user.academicInfo,
                profileInfo: user.profileInfo
            },
            redirectUrl: user.role === 'lecturer' ? '/html/lecturer/dashboard.html' : '/html/student/dashboard.html'
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: error.message 
        });
    }
});


// MongoDB-based Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('🔍 DEBUG - Raw registration request body:', req.body);
        
        // Extract all possible fields
        let { username, name, email, password, confirmPassword, role, employeeId, studentId } = req.body;
        
        // Alternative field extraction
        if (!name) {
            name = req.body.user || req.body.name || req.body.registerUser || username;
        }
        if (!email) {
            email = req.body.mail || req.body.userEmail || req.body.registerEmail;
        }
        if (!password) {
            password = req.body.pass || req.body.userPassword || req.body.registerPassword;
        }
        if (!role) {
            role = req.body.userRole || req.body.accountType || 'student';
        }
        if (!employeeId && role === 'lecturer') {
            employeeId = req.body.employeeId || name;
        }
        if (!studentId && role === 'student') {
            studentId = req.body.studentId || name;
        }

        console.log('📝 MongoDB Registration attempt for:', name);
        console.log('📧 Email:', email);
        console.log('🎭 Role:', role);
        console.log('🆔 Employee ID:', employeeId);
        console.log('🆔 Student ID:', studentId);
        console.log('🔑 Password provided:', !!password);

        // Basic validation
        if (!name || !email || !password || !role) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        // Password confirmation (if provided)
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Passwords do not match' 
            });
        }

        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ 
            $or: [
                { email: email },
                { name: name }
            ]
        });

        if (existingUser) {
            console.log('❌ User already exists in MongoDB:', email);
            return res.status(400).json({ 
                success: false,
                message: 'User with this email or name already exists' 
            });
        }

        // Check if employeeId/studentId already exists
        if (employeeId) {
            const existingEmployee = await User.findOne({ 'academicInfo.employeeId': employeeId });
            if (existingEmployee) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Employee ID already exists' 
                });
            }
        }

        if (studentId) {
            const existingStudent = await User.findOne({ 'academicInfo.studentId': studentId });
            if (existingStudent) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Student ID already exists' 
                });
            }
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user in MongoDB
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            academicInfo: {
                employeeId: role === 'lecturer' ? (employeeId || name) : undefined,
                studentId: role === 'student' ? (studentId || name) : undefined,
                department: req.body.department || 'General',
                semester: role === 'student' ? (req.body.semester || 1) : undefined
            },
            profileInfo: {
                avatar: req.body.avatar || '',
                bio: req.body.bio || '',
                phone: req.body.phone || ''
            }
        });

        console.log('✅ User saved to MongoDB:', newUser.email, 'with ID:', newUser._id);

        // FIXED: Generate token with complete user data
        const token = jwt.sign(
            { 
                userId: newUser._id, 
                username: newUser.name, 
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                employeeId: newUser.academicInfo?.employeeId,
                studentId: newUser.academicInfo?.studentId
            }, 
            JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully and saved to MongoDB',
            token,
            role: newUser.role,
            user: { 
                id: newUser._id, 
                username: newUser.name, 
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                employeeId: newUser.academicInfo?.employeeId,
                studentId: newUser.academicInfo?.studentId,
                department: newUser.academicInfo?.department
            }
        });
    } catch (error) {
        console.error('💥 MongoDB Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    console.log('🚪 Logout request received');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Token verification endpoint - MongoDB
app.post('/api/auth/verify', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found in MongoDB' 
            });
        }

        res.json({
            success: true,
            message: 'Token valid',
            user: {
                id: user._id,
                username: user.name,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.academicInfo?.employeeId,
                studentId: user.academicInfo?.studentId,
                department: user.academicInfo?.department
            }
        });
    } catch (err) {
        return res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
});

// FIXED: Get current user info endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Getting user info for:', req.user.name);
        
        res.json({
            success: true,
            user: {
                id: req.user.userId,
                username: req.user.name,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                employeeId: req.user.employeeId,
                studentId: req.user.studentId,
                department: req.user.department
            }
        });
    } catch (error) {
        console.error('💥 Get user info error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user info',
            error: error.message
        });
    }
});

// Get all users endpoint - MongoDB
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field
        
        const publicUsers = users.map(user => ({
            id: user._id,
            username: user.name,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.academicInfo?.employeeId,
            studentId: user.academicInfo?.studentId,
            department: user.academicInfo?.department,
            createdAt: user.createdAt
        }));
        
        res.json({ 
            success: true,
            users: publicUsers, 
            total: users.length,
            timestamp: new Date().toISOString(),
            message: users.length === 0 ? 'No users registered yet' : `${users.length} users found in MongoDB`
        });
    } catch (error) {
        console.error('💥 Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching users from MongoDB',
            error: error.message
        });
    }
});

// Clear all users endpoint (for testing) - MongoDB
app.delete('/api/users/clear', async (req, res) => {
    try {
        const result = await User.deleteMany({});
        console.log(`🗑️ Cleared ${result.deletedCount} users from MongoDB`);
        
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} users from MongoDB`,
            deletedCount: result.deletedCount,
            remainingUsers: 0
        });
    } catch (error) {
        console.error('💥 Clear users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error clearing users from MongoDB',
            error: error.message
        });
    }
});

// Protected route - User profile - MongoDB
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Profile request for user:', req.user.name);
        
        res.json({
            success: true,
            user: {
                id: req.user.userId,
                username: req.user.name,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                employeeId: req.user.employeeId,
                studentId: req.user.studentId,
                department: req.user.department
            }
        });
    } catch (error) {
        console.error('💥 Get profile error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching profile from MongoDB',
            error: error.message
        });
    }
});


// 📋 PRESENTATION ENDPOINTS
// Add this debug middleware before your presentation endpoints
app.use('/api/presentations*', (req, res, next) => {
    console.log(`🔍 Presentation API called: ${req.method} ${req.path}`);
    console.log('🔍 User:', req.user?.name || 'No user');
    next();
});

// Get all presentations for a lecturer
app.get('/api/presentations', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only lecturers can view presentations.' 
            });
        }

        const presentations = await Presentation.find({ lecturer: req.user.userId })
            .populate('course', 'title code')
            .sort({ createdAt: -1 });

        // Calculate stats
        const stats = {
            total: presentations.length,
            active: presentations.filter(p => p.status === 'active').length,
            pending: presentations.filter(p => p.status === 'pending').length,
            completed: presentations.filter(p => p.status === 'completed').length,
            averageScore: 0 // Calculate from submissions if needed
        };

        res.json({
            success: true,
            presentations: presentations,
            stats: stats
        });

    } catch (error) {
        console.error('Error fetching presentations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentations'
        });
    }
});

// Get presentation statistics
app.get('/api/presentations/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied.' 
            });
        }

        console.log('📊 Getting presentation stats for lecturer:', req.user.name);

        const presentations = await Presentation.find({ lecturer: req.user.userId });
        
        const stats = {
            total: presentations.length,
            active: presentations.filter(p => p.status === 'active' || p.status === 'published').length,
            pending: presentations.filter(p => p.status === 'pending').length,
            completed: presentations.filter(p => p.status === 'completed').length,
            averageScore: presentations.length > 0 ? 
                presentations.reduce((sum, p) => sum + (p.analytics?.averageScore || 0), 0) / presentations.length : 0
        };

        console.log('📊 Presentation stats calculated:', stats);

        res.json({
            success: true,
            total: stats.total,
            active: stats.active,
            pending: stats.pending,
            completed: stats.completed,
            averageScore: Math.round(stats.averageScore)
        });

    } catch (error) {
        console.error('💥 Error fetching presentation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentation stats',
            error: error.message
        });
    }
});


// Update the create presentation endpoint in server.js
app.post('/api/presentations', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only lecturers can create presentations.' 
            });
        }

        const {
            title, description, course, type, duration,
            schedule, grading, requirements, groupSettings,
            selectedStudents, notificationMode
        } = req.body;

        // Validate required fields
        if (!title || !course || !type || !duration || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, course, type, duration, description'
            });
        }

        // Verify course belongs to lecturer
        const courseDoc = await Course.findOne({ 
            _id: course, 
            lecturer: req.user.userId 
        });

        if (!courseDoc) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or access denied'
            });
        }

        // Create new presentation using your advanced schema
        const newPresentation = new Presentation({
            title: title.trim(),
            description: description.trim(),
            course: course,
            lecturer: req.user.userId,
            type: type,
            duration: parseInt(duration),
            
            // Use your advanced schedule structure
            schedule: {
                assignedDate: schedule?.assignedDate ? new Date(schedule.assignedDate) : new Date(),
                dueDate: schedule?.dueDate ? new Date(schedule.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                presentationDate: schedule?.presentationDate ? new Date(schedule.presentationDate) : null,
                presentationTime: schedule?.presentationTime
            },
            
            // Use your advanced grading structure
            grading: {
                maxScore: parseInt(grading?.maxScore) || 100,
                method: grading?.method || 'criteria',
                weightage: parseInt(grading?.weightage) || 20,
                criteria: grading?.criteria || [
                    { name: 'Content', weight: 40, description: 'Quality and accuracy of content' },
                    { name: 'Delivery', weight: 30, description: 'Presentation skills and delivery' },
                    { name: 'Visual Aids', weight: 20, description: 'Effective use of visual aids' },
                    { name: 'Time Management', weight: 10, description: 'Adherence to time limit' }
                ],
                allowLateSubmission: grading?.allowLateSubmission || 'no',
                latePenalty: parseInt(grading?.latePenalty) || 10
            },
            
            // Use your requirements structure
            requirements: {
                format: requirements?.format || 'PowerPoint presentation with speaker notes',
                minSlides: parseInt(requirements?.minSlides) || 5,
                maxSlides: parseInt(requirements?.maxSlides) || 15,
                submissionFormat: requirements?.submissionFormat || 'pptx',
                maxFileSize: parseInt(requirements?.maxFileSize) || 50,
                resources: requirements?.resources
            },
            
            // Handle group settings if it's a group presentation
            groupSettings: type === 'group' ? {
                groupSize: parseInt(groupSettings?.groupSize) || 3,
                formation: groupSettings?.formation || 'student-choice',
                allowSelfSelection: groupSettings?.allowSelfSelection !== false
            } : undefined,
            
            // Handle selected students
            selectedStudents: selectedStudents || [],
            
            status: 'active'
        });

        const savedPresentation = await newPresentation.save();
        
        // Populate course info for response
        await savedPresentation.populate('course', 'title code');

        console.log('✅ Presentation created:', savedPresentation.title);

        res.status(201).json({
            success: true,
            message: 'Presentation created successfully',
            presentation: savedPresentation
        });

    } catch (error) {
        console.error('Error creating presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating presentation',
            error: error.message
        });
    }
});



// Get students for a specific course
app.get('/api/presentations/course/:courseId/students', authenticateToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Verify course belongs to lecturer
        const course = await Course.findOne({ 
            _id: courseId, 
            lecturer: req.user.userId 
        });
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or access denied'
            });
        }

        // Get enrolled students
        const enrolledStudentIds = course.students || [];
        
        if (enrolledStudentIds.length === 0) {
            return res.json({
                success: true,
                students: [],
                course: {
                    id: course._id,
                    title: course.title,
                    code: course.code
                }
            });
        }

        // Find actual user documents for enrolled students
        const students = await User.find({
            $or: [
                { 'academicInfo.studentId': { $in: enrolledStudentIds } },
                { name: { $in: enrolledStudentIds } }
            ],
            role: 'student'
        }).select('name email academicInfo.studentId');

        const formattedStudents = students.map(student => ({
            _id: student._id,
            name: student.name,
            email: student.email,
            studentId: student.academicInfo?.studentId || student.name,
            enrolled: true
        }));

        res.json({
            success: true,
            students: formattedStudents,
            course: {
                id: course._id,
                title: course.title,
                code: course.code
            }
        });

    } catch (error) {
        console.error('Error fetching course students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students'
        });
    }
});

// Cancel presentation
app.put('/api/presentations/:presentationId/cancel', authenticateToken, async (req, res) => {
    try {
        const { presentationId } = req.params;
        
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only lecturers can cancel presentations.' 
            });
        }

        const presentation = await Presentation.findOneAndUpdate(
            { _id: presentationId, lecturer: req.user.userId },
            { status: 'cancelled' },
            { new: true }
        );

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found or access denied'
            });
        }

        console.log('✅ Presentation cancelled:', presentation.title);

        res.json({
            success: true,
            message: 'Presentation cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling presentation'
        });
    }
});

// 👨‍🎓 STUDENT PRESENTATION ENDPOINTS

// Replace the existing /api/student/presentations endpoint (around line 900) with this:
// REPLACE the existing /api/student/presentations endpoint with this FIXED version:
app.get('/api/student/presentations', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only students can view presentations.' 
            });
        }

        console.log('📋 Loading presentations for student:', req.user.name);

        // Get all active presentations from all lecturers with proper population
        const presentations = await Presentation.find({ 
            status: { $in: ['active', 'published'] }
        })
        .populate('course', 'title code students')
        .populate('lecturer', 'name email')
        .sort({ 'schedule.dueDate': 1 }); // Sort by due date

        console.log(`📊 Found ${presentations.length} total presentations`);

        // FIXED: Filter out presentations with null course and process each presentation
        const validPresentations = presentations.filter(presentation => presentation.course !== null);
        console.log(`📊 Valid presentations (with courses): ${validPresentations.length}`);

        const processedPresentations = validPresentations.map(presentation => {
            // Check if student has submitted
            const userSubmission = presentation.submissions ? presentation.submissions.find(sub => 
                sub.student.toString() === req.user.userId.toString()
            ) : null;

            // FIXED: Safely check course enrollment
            const isEnrolledInCourse = presentation.course && presentation.course.students ? 
                presentation.course.students.includes(req.user.studentId || req.user.name) : false;

            // Determine if student is eligible for this presentation
            const isEligible = checkStudentEligibility(presentation, req.user);

            // Calculate status
            const submissionStatus = getSubmissionStatus(presentation, userSubmission);
            const isOverdue = new Date() > new Date(presentation.schedule.dueDate) && !userSubmission;

            return {
                _id: presentation._id,
                title: presentation.title,
                description: presentation.description,
                course: {
                    _id: presentation.course._id,
                    title: presentation.course.title,
                    code: presentation.course.code
                },
                lecturer: {
                    _id: presentation.lecturer._id,
                    name: presentation.lecturer.name,
                    email: presentation.lecturer.email
                },
                type: presentation.type,
                duration: presentation.duration,
                schedule: presentation.schedule,
                grading: {
                    maxScore: presentation.grading.maxScore,
                    criteria: presentation.grading.criteria
                },
                requirements: presentation.requirements,
                status: presentation.status,
                
                // Student-specific fields
                isEligible: isEligible,
                isEnrolledInCourse: isEnrolledInCourse,
                hasSubmitted: !!userSubmission,
                userSubmission: userSubmission || null,
                submissionStatus: submissionStatus,
                isOverdue: isOverdue
            };
        });

        // Filter to show only eligible presentations
        const eligiblePresentations = processedPresentations.filter(p => p.isEligible || p.isEnrolledInCourse);

        const stats = {
            total: eligiblePresentations.length,
            upcoming: eligiblePresentations.filter(p => !p.hasSubmitted && !p.isOverdue).length,
            submitted: eligiblePresentations.filter(p => p.hasSubmitted && p.submissionStatus !== 'graded').length,
            graded: eligiblePresentations.filter(p => p.submissionStatus === 'graded').length,
            overdue: eligiblePresentations.filter(p => p.isOverdue).length
        };

        console.log(`✅ Returning ${eligiblePresentations.length} eligible presentations for ${req.user.name}`);

        res.json({
            success: true,
            presentations: eligiblePresentations,
            stats: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Error fetching student presentations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentations',
            error: error.message
        });
    }
});
// REPLACE the helper functions with these FIXED versions:

// Helper function to check if student is eligible for a presentation - FIXED
function checkStudentEligibility(presentation, user) {
    // If specific students are selected, check if this student is included
    if (presentation.selectedStudents && presentation.selectedStudents.length > 0) {
        return presentation.selectedStudents.some(studentId => 
            studentId.toString() === user.userId.toString()
        );
    }
    
    // FIXED: Check course enrollment safely
    if (presentation.course && presentation.course.students) {
        const studentIdentifier = user.studentId || user.name;
        return presentation.course.students.includes(studentIdentifier);
    }
    
    // If no course or no restrictions, show to all students
    return true;
}

// Helper function to determine submission status - FIXED

 function getSubmissionStatus(presentation, userSubmission) {
    if (!userSubmission) {
        const dueDate = presentation.schedule ? presentation.schedule.dueDate : null;
        if (dueDate && new Date() > new Date(dueDate)) {
            return 'overdue';
        }
        return 'not_submitted';
    }
    
    if (userSubmission.grade && userSubmission.grade.totalScore !== undefined) {
        return 'graded';
    }
    
    return 'submitted';
}

// Submit presentation
app.post('/api/student/presentations/:presentationId/submit', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only students can submit presentations.' 
            });
        }

        const { presentationId } = req.params;
        const { fileUrl, notes } = req.body;

        const presentation = await Presentation.findById(presentationId);
        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Check if submission is allowed
        if (presentation.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Presentation is not accepting submissions'
            });
        }

        // Check due date
        if (new Date() > presentation.schedule.dueDate) {
            return res.status(400).json({
                success: false,
                message: 'Submission deadline has passed'
            });
        }

        // Add submission
        presentation.addSubmission(req.user.userId, {
            fileUrl: fileUrl,
            notes: notes
        });

        await presentation.save();

        res.json({
            success: true,
            message: 'Presentation submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting presentation'
        });
    }
});


app.get('/api/student/presentations/:presentationId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied.' 
            });
        }

        const { presentationId } = req.params;
        
        const presentation = await Presentation.findById(presentationId)
            .populate('course', 'title code description')
            .populate('lecturer', 'name email');

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Check if student is eligible to view this presentation
        const isEligible = checkStudentEligibility(presentation, req.user);
        if (!isEligible) {
            return res.status(403).json({
                success: false,
                message: 'You are not eligible to view this presentation'
            });
        }

        // Get user's submission if exists
        const userSubmission = presentation.submissions.find(sub => 
            sub.student.toString() === req.user.userId.toString()
        );

        // Increment view count (analytics)
        presentation.analytics.views += 1;
        await presentation.save();

        const detailedPresentation = {
            _id: presentation._id,
            title: presentation.title,
            description: presentation.description,
            course: presentation.course,
            lecturer: presentation.lecturer,
            type: presentation.type,
            duration: presentation.duration,
            schedule: presentation.schedule,
            grading: presentation.grading,
            requirements: presentation.requirements,
            groupSettings: presentation.groupSettings,
            status: presentation.status,
            
            // Student-specific information
            userSubmission: userSubmission,
            hasSubmitted: !!userSubmission,
            submissionStatus: getSubmissionStatus(presentation, userSubmission),
            isOverdue: new Date() > new Date(presentation.schedule.dueDate) && !userSubmission,
            canSubmit: presentation.status === 'active' && 
                       new Date() <= new Date(presentation.schedule.dueDate) && 
                       !userSubmission,
            
            // Statistics
            totalSubmissions: presentation.submissions.length,
            analytics: presentation.analytics
        };

        res.json({
            success: true,
            presentation: detailedPresentation
        });

    } catch (error) {
        console.error('💥 Error fetching presentation details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentation details',
            error: error.message
        });
    }
});

// Add this endpoint for student participation:
app.post('/api/student/presentations/:presentationId/participate', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied.' 
            });
        }

        const { presentationId } = req.params;
        const { submissionData, files, comments } = req.body;

        const presentation = await Presentation.findById(presentationId);
        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Validate participation eligibility
        const isEligible = checkStudentEligibility(presentation, req.user);
        if (!isEligible) {
            return res.status(403).json({
                success: false,
                message: 'You are not eligible to participate in this presentation'
            });
        }

        // Check if already submitted
        const existingSubmission = presentation.submissions.find(sub => 
            sub.student.toString() === req.user.userId.toString()
        );

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted for this presentation'
            });
        }

        // Check if submission is still allowed
        if (presentation.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This presentation is not accepting submissions'
            });
        }

        const now = new Date();
        const dueDate = new Date(presentation.schedule.dueDate);
        
        if (now > dueDate && presentation.grading.allowLateSubmission === 'no') {
            return res.status(400).json({
                success: false,
                message: 'Submission deadline has passed'
            });
        }

        // Create submission
        const newSubmission = {
            student: req.user.userId,
            submittedAt: new Date(),
            files: files || [],
            comments: comments || '',
            status: now > dueDate ? 'late' : 'submitted'
        };

        presentation.submissions.push(newSubmission);
        await presentation.save();

        console.log(`✅ Student ${req.user.name} participated in presentation: ${presentation.title}`);

        res.json({
            success: true,
            message: 'Successfully participated in presentation',
            submission: newSubmission
        });

    } catch (error) {
        console.error('💥 Error in presentation participation:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting presentation',
            error: error.message
        });
    }
});

// Add general courses endpoint
app.get('/api/courses', authenticateToken, async (req, res) => {
    try {
        let courses = [];
        
        if (req.user.role === 'lecturer') {
            courses = await Course.find({ lecturer: req.user.userId });
        } else {
            courses = await Course.find({}).populate('lecturer', 'name');
        }
        
        res.json({
            success: true,
            courses: courses,
            total: courses.length
        });
        
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching courses'
        });
    }
});

// 👨‍🏫 LECTURER API ENDPOINTS - MongoDB

// REPLACE the lecturer dashboard endpoint (around line 544) with this:

// Get lecturer dashboard data - FIXED: Match frontend expectations
app.get('/api/lecturer/dashboard', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Lecturer dashboard request for:', req.user.name, '(ID:', req.user.userId, ')');
        
        // Get all courses for this lecturer
        const allCourses = await Course.find({ lecturer: req.user.userId });
        
        // Filter active courses (currently teaching)
        const activeCourses = allCourses.filter(course => course.status === 'active');
        
        // Calculate total enrolled students across all courses
        const totalStudents = allCourses.reduce((total, course) => {
            return total + (course.enrolledStudents?.length || 0);
        }, 0);
        
        console.log('📚 Dashboard stats for', req.user.name + ':');
        console.log('   - All courses:', allCourses.length);
        console.log('   - Active/Teaching:', activeCourses.length);
        console.log('   - Total students:', totalStudents);
        
        // Return multiple field name variations to match frontend expectations
        res.json({
            success: true,
            data: {
                // Standard field names
                totalCourses: allCourses.length,
                activeCourses: activeCourses.length,
                totalStudents: totalStudents,
                assignmentsToGrade: 0,
                createdPresentations: 0,
                recentActivity: [],
                upcomingDeadlines: [],
                
                // Alternative field names the frontend might expect
                allCourses: allCourses.length,
                currentlyTeaching: activeCourses.length,
                enrolledStudents: totalStudents,
                createdAssignments: 0,
                
                // Dashboard-specific field names
                coursesTeaching: activeCourses.length,
                studentsEnrolled: totalStudents,
                coursesTotal: allCourses.length
            },
            // Additional stats for debugging
            stats: {
                total_courses: allCourses.length,
                active_courses: activeCourses.length,
                total_students: totalStudents,
                courses_count: allCourses.length,
                teaching_count: activeCourses.length,
                students_count: totalStudents
            },
            user: {
                name: req.user.name,
                role: req.user.role,
                employeeId: req.user.employeeId
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('💥 Lecturer dashboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching dashboard data from MongoDB',
            error: error.message
        });
    }
});

// Get lecturer courses
app.get('/api/lecturer/courses', authenticateToken, async (req, res) => {
    try {
        console.log('📚 Lecturer courses request for:', req.user.name);
        
        const courses = await Course.find({ lecturer: req.user.userId });
        
        res.json({
            success: true,
            courses: courses,
            total: courses.length,
            user: {
                name: req.user.name,
                role: req.user.role
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('💥 Lecturer courses error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching courses from MongoDB',
            error: error.message
        });
    }
});

// CREATE COURSE ENDPOINT - FIXED TO MATCH SCHEMA
app.post('/api/lecturer/courses', authenticateToken, async (req, res) => {
    try {
        console.log('🎓 Lecturer course creation request from:', req.user.name);
        console.log('📥 Course data received:', req.body);

        // Verify user is a lecturer
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Only lecturers can create courses.' 
            });
        }

        const {
            title,
            description,
            code,
            category,
            level,
            credits,
            startDate,
            endDate,
            maxStudents,
            schedule,
            grading,
            status
        } = req.body;

        // Validate required fields
        if (!title || !description || !code || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, code, category'
            });
        }

        // Check if course code already exists
        const existingCourse = await Course.findOne({ code: code.toLowerCase() });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists. Please choose a different code.'
            });
        }

        // Create new course - FIXED: Use 'lecturer' field
        const newCourse = new Course({
            title: title.trim(),
            description: description.trim(),
            code: code.toLowerCase().replace(/\s+/g, ''),
            category,
            level: level || 'Beginner',
            credits: parseInt(credits) || 3,
            maxStudents: parseInt(maxStudents) || 50,
            lecturer: req.user.userId,  // ✅ FIXED: Use 'lecturer' instead of 'instructor'
            schedule: schedule || [],
            grading: grading || {
                assignments: 30,
                midterm: 25,
                final: 35,
                participation: 10
            },
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: status || 'active',
            enrolledStudents: []
        });

        // Save to MongoDB
        const savedCourse = await newCourse.save();
        

        console.log('✅ Course created successfully:', savedCourse.title, 'ID:', savedCourse._id);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: savedCourse
        });

    } catch (error) {
        console.error('💥 Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course: ' + error.message
        });
    }
});

// 👨‍🎓 STUDENT API ENDPOINTS - MongoDB

// Get student dashboard data
app.get('/api/student/dashboard', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Student dashboard request for:', req.user.name);
        
        const courses = await Course.find({ enrolledStudents: req.user.userId });
        
        res.json({
            success: true,
            data: {
                enrolledCourses: courses.length,
                pendingAssignments: 0,
                upcomingDeadlines: [],
                recentGrades: [],
                announcements: []
            },
            user: {
                name: req.user.name,
                role: req.user.role,
                studentId: req.user.studentId
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('💥 Student dashboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching dashboard data from MongoDB',
            error: error.message
        });
    }
});

// REPLACE the existing student courses endpoint with this enhanced version:

// Get available courses for student - ENHANCED to show all courses
// Enhanced courses listing endpoint - add this to your backend file
// Enhanced courses listing endpoint - FIXED for string-based student IDs
app.get('/api/student/courses', authenticateToken, async (req, res) => {
    try {
        // 🔧 FIX: Use the correct student identifier
        const studentId = req.user.studentId || req.user.name || req.user.userId;
        console.log('🔍 Fetching courses for student:', studentId);
        
        // Fetch all courses
        const courses = await Course.find({}).populate('lecturer', 'name');
        console.log('📚 Total courses found:', courses.length);
        
        // Process each course to check enrollment status
        const coursesWithEnrollment = courses.map(course => {
            // 🔧 FIX: Check enrollment using string comparison (not ObjectId)
            const isEnrolled = course.students && course.students.includes(studentId);
            
            console.log(`📋 Course ${course.title}:`, {
                id: course._id,
                hasStudentsArray: !!course.students,
                studentsCount: course.students ? course.students.length : 0,
                isStudentEnrolled: isEnrolled,
                studentsList: course.students || [],
                searchingFor: studentId,
                studentsType: course.students ? typeof course.students[0] : 'none'
            });
            
            return {
                _id: course._id,
                title: course.title,
                code: course.code,
                description: course.description,
                lecturer: course.lecturer,
                lecturerName: course.lecturerName || (course.lecturer ? course.lecturer.name : 'Unknown'),
                credits: course.credits,
                maxStudents: course.maxStudents,
                enrolledCount: course.students ? course.students.length : 0,
                students: course.students,
                isEnrolled: isEnrolled,
                enrolled: isEnrolled,
                enrollmentStatus: isEnrolled ? 'enrolled' : 'available',
                level: course.level || 'Beginner'
            };
        });
        
        // Separate enrolled and available courses
        const enrolledCourses = coursesWithEnrollment.filter(course => course.isEnrolled);
        const availableCourses = coursesWithEnrollment.filter(course => !course.isEnrolled);
        
        console.log('📊 Final course counts:', {
            total: coursesWithEnrollment.length,
            enrolled: enrolledCourses.length,
            available: availableCourses.length
        });
        
        console.log('✅ Returning course data with enrollment status');
        
        res.json({
            success: true,
            courses: coursesWithEnrollment,
            enrolled: enrolledCourses.length,
            available: availableCourses.length,
            enrolledCourses: enrolledCourses,
            availableCourses: availableCourses
        });
        
    } catch (error) {
        console.error('💥 Error fetching student courses:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// ADD: Course enrollment endpoint for students (ADD THIS AFTER THE ABOVE)
// Enhanced enrollment endpoint - add this to your backend file
// Enhanced enrollment endpoint - FIXED to handle student ID properly
// Enhanced enrollment endpoint - Updated for new schema
app.post('/api/student/courses/:courseId/enroll', authenticateToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const studentId = req.user.studentId || req.user.name || req.user.userId;
        
        console.log('📝 Enrollment request:', {
            courseId: courseId,
            studentId: studentId,
            studentIdType: typeof studentId
        });
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            console.log('❌ Course not found:', courseId);
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        console.log('📚 Found course:', {
            title: course.title,
            currentStudents: course.students || [],
            studentsCount: course.getEnrolledCount(),
            canEnroll: course.canEnroll()
        });
        
        // Check if enrollment is allowed
        if (!course.canEnroll()) {
            const reasons = [];
            if (course.status !== 'active') reasons.push('Course is not active');
            if (course.enrollmentEndDate && new Date() > course.enrollmentEndDate) reasons.push('Enrollment period has ended');
            if (course.maxStudents && course.getEnrolledCount() >= course.maxStudents) reasons.push('Course is full');
            
            return res.status(400).json({ 
                success: false, 
                message: 'Enrollment not allowed: ' + reasons.join(', ')
            });
        }
        
        // Check if already enrolled
        if (course.isStudentEnrolled(studentId)) {
            console.log('⚠️ Student already enrolled');
            return res.status(400).json({ 
                success: false, 
                message: 'Already enrolled in this course' 
            });
        }
        
        // Add student to course
        const enrollmentSuccess = course.addStudent(studentId);
        if (!enrollmentSuccess) {
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to enroll student' 
            });
        }
        
        // Save the course
        await course.save();
        
        console.log('✅ Student enrolled successfully:', {
            courseId: courseId,
            courseTitle: course.title,
            studentId: studentId,
            newStudentsCount: course.getEnrolledCount()
        });
        
        res.json({ 
            success: true, 
            message: `Successfully enrolled in ${course.title}`,
            course: {
                id: course._id,
                title: course.title,
                enrolledCount: course.getEnrolledCount()
            }
        });
        
    } catch (error) {
        console.error('💥 Enrollment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during enrollment',
            error: error.message 
        });
    }
});

// ADD: Course unenrollment endpoint for students (ADD THIS AFTER THE ABOVE)
app.delete('/api/student/courses/:courseId/enroll', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        
        console.log('📚 Unenrollment request for course:', courseId, 'by student:', req.user.name);
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Check if enrolled
        if (!course.enrolledStudents || !course.enrolledStudents.includes(req.user.userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }
        
        // Unenroll the student
        course.enrolledStudents = course.enrolledStudents.filter(studentId => 
            studentId.toString() !== req.user.userId
        );
        await course.save();
        
        console.log('✅ Student', req.user.name, 'unenrolled from course:', course.title);
        
        res.json({
            success: true,
            message: `Successfully unenrolled from ${course.title}`,
            course: {
                _id: course._id,
                title: course.title,
                code: course.code,
                enrolledCount: course.enrolledStudents.length
            }
        });
        
    } catch (error) {
        console.error('💥 Course unenrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unenrolling from course',
            error: error.message
        });
    }
});
 
// API Documentation endpoint 
app.get('/api/docs', async (req, res) => { 
    try {
        const userCount = await User.countDocuments();
        const courseCount = await Course.countDocuments();
        
        res.json({ 
            message: 'Academia LMS API Documentation', 
            version: '1.0.0', 
            status: 'running', 
            timestamp: new Date().toISOString(),
            mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            mongoStats: {
                users: userCount,
                courses: courseCount
            },
            authentication: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                logout: 'POST /api/auth/logout',
                verify: 'POST /api/auth/verify',
                me: 'GET /api/auth/me (requires token)',
                profile: 'GET /api/profile (requires token)'
            },
            lecturerEndpoints: {
                dashboard: 'GET /api/lecturer/dashboard (requires token)',
                courses: 'GET /api/lecturer/courses (requires token)',
                createCourse: 'POST /api/lecturer/courses (requires token)'
            },
            studentEndpoints: {
                dashboard: 'GET /api/student/dashboard (requires token)',
                courses: 'GET /api/student/courses (requires token)'
            },
            note: 'All data is now persisted in MongoDB Atlas',
            endpoints: { 
                auth: '/api/auth/*',
                users: '/api/users',
                clearUsers: 'DELETE /api/users/clear',
                profile: '/api/profile',
                health: '/api/health',
                docs: '/api/docs'
            }, 
            frontend: { 
                login: '/html/login.html', 
                register: '/html/register.html', 
                studentDashboard: '/html/student/dashboard.html', 
                lecturerDashboard: '/html/lecturer/dashboard.html' 
            } 
        });
    } catch (error) {
        res.json({ 
            message: 'Academia LMS API Documentation', 
            error: 'Could not fetch MongoDB stats',
            mongoStatus: 'error'
        });
    }
}); 
 
// Health check endpoint 
app.get('/api/health', async (req, res) => { 
    try {
        const userCount = await User.countDocuments();
        const courseCount = await Course.countDocuments();
        
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(), 
            uptime: process.uptime(), 
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            registeredUsers: userCount,
            totalCourses: courseCount,
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            database: 'MongoDB Atlas'
        });
    } catch (error) {
        res.json({ 
            status: 'healthy', 
            mongodb: 'error',
            error: error.message
        });
    }
}); 
 
// Serve login page at root 
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html')); 
}); 
 
// Handle SPA routes and serve static files properly 
app.get('*', (req, res) => { 
    // If it's an API route, return 404 
    if (req.path.startsWith('/api/')) { 
        return res.status(404).json({ 
            error: 'API endpoint not found', 
            path: req.path, 
            available: '/api/docs' 
        }); 
    } 
    // For HTML pages, serve login.html as fallback 
    res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html')); 
}); 
 
// Enhanced server startup 
app.listen(PORT, async () => { 
    console.log('╔══════════════════════════════════════════════════════════════╗'); 
    console.log('║                🚀 Academia LMS Server Started               ║'); 
    console.log('╚══════════════════════════════════════════════════════════════╝'); 
    console.log(); 
    console.log('📱 Main Application:     http://localhost:' + PORT); 
    console.log('🔐 Login Page:           http://localhost:' + PORT + '/html/login.html'); 
    console.log('📝 Register Page:        http://localhost:' + PORT + '/html/register.html'); 
    console.log('👨‍🎓 Student Dashboard:    http://localhost:' + PORT + '/html/student/dashboard.html'); 
    console.log('👨‍🏫 Lecturer Dashboard:   http://localhost:' + PORT + '/html/lecturer/dashboard.html'); 
    console.log('📚 API Documentation:    http://localhost:' + PORT + '/api/docs'); 
    console.log('💚 Health Check:         http://localhost:' + PORT + '/api/health'); 
    console.log('👥 Registered Users:     http://localhost:' + PORT + '/api/users');
    console.log();
    
    // Show MongoDB status
    try {
        const userCount = await User.countDocuments();
        const courseCount = await Course.countDocuments();
        console.log('🗃️ Database Status: MongoDB Atlas Connected');
        console.log('📊 Current users in MongoDB:', userCount);
        console.log('📚 Current courses in MongoDB:', courseCount);
    } catch (error) {
        console.log('🗃️ Database Status: MongoDB connection issue');
    }
    
    console.log('💾 All registration data will be saved to MongoDB');
    console.log(); 
    console.log('🛑 Press Ctrl+C to stop the server'); 
    console.log('═══════════════════════════════════════════════════════════════'); 
}); 
 
// FIXED: Graceful shutdown - remove callback parameter
process.on('SIGINT', async () => { 
    console.log('\n🛑 Shutting down gracefully...'); 
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed'); 
        process.exit(0); 
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
    }
});



