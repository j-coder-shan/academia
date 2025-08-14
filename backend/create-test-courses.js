const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected for test data creation');
    createTestCourses();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Import models
const Course = require('./models/courseModel');
const User = require('./models/userModel');

async function createTestCourses() {
    try {
        // First, let's create a test lecturer if one doesn't exist
        let lecturer = await User.findOne({ role: 'lecturer' });
        
        if (!lecturer) {
            lecturer = await User.create({
                name: 'Dr. John Smith',
                email: 'lecturer@test.com',
                password: 'password123',
                role: 'lecturer',
                department: 'Computer Science'
            });
            console.log('Created test lecturer:', lecturer.name);
        }

        // Check if we already have courses
        const existingCourses = await Course.find();
        if (existingCourses.length > 0) {
            console.log(`Found ${existingCourses.length} existing courses. Skipping creation.`);
            return;
        }

        // Create test courses
        const testCourses = [
            {
                title: 'Introduction to JavaScript',
                code: 'CS101',
                description: 'Learn the fundamentals of JavaScript programming language. This course covers variables, functions, objects, and modern ES6+ features.',
                category: 'programming',
                level: 'beginner',
                credits: 3,
                lecturer: lecturer._id,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-12-15'),
                maxStudents: 30,
                schedule: [
                    { day: 'Monday', time: '10:00 AM', duration: 90 },
                    { day: 'Wednesday', time: '10:00 AM', duration: 90 }
                ],
                status: 'published',
                enrolledStudents: []
            },
            {
                title: 'Advanced React Development',
                code: 'CS201',
                description: 'Master React.js with hooks, context, state management, and modern patterns. Build professional web applications.',
                category: 'programming',
                level: 'intermediate',
                credits: 4,
                lecturer: lecturer._id,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-12-15'),
                maxStudents: 25,
                schedule: [
                    { day: 'Tuesday', time: '2:00 PM', duration: 120 },
                    { day: 'Thursday', time: '2:00 PM', duration: 120 }
                ],
                status: 'published',
                enrolledStudents: []
            },
            {
                title: 'Database Design and SQL',
                code: 'CS301',
                description: 'Learn database design principles, normalization, and SQL queries. Work with MySQL and MongoDB.',
                category: 'database',
                level: 'intermediate',
                credits: 3,
                lecturer: lecturer._id,
                startDate: new Date('2024-09-15'),
                endDate: new Date('2024-12-20'),
                maxStudents: 35,
                schedule: [
                    { day: 'Monday', time: '1:00 PM', duration: 90 },
                    { day: 'Friday', time: '1:00 PM', duration: 90 }
                ],
                status: 'published',
                enrolledStudents: []
            },
            {
                title: 'Machine Learning Basics',
                code: 'AI101',
                description: 'Introduction to machine learning concepts, algorithms, and Python libraries like scikit-learn and pandas.',
                category: 'ai',
                level: 'intermediate',
                credits: 4,
                lecturer: lecturer._id,
                startDate: new Date('2024-10-01'),
                endDate: new Date('2025-01-15'),
                maxStudents: 20,
                schedule: [
                    { day: 'Wednesday', time: '3:00 PM', duration: 120 },
                    { day: 'Friday', time: '3:00 PM', duration: 120 }
                ],
                status: 'published',
                enrolledStudents: []
            },
            {
                title: 'Web Security Fundamentals',
                code: 'SEC101',
                description: 'Learn about web application security, common vulnerabilities, and how to protect applications.',
                category: 'security',
                level: 'intermediate',
                credits: 3,
                lecturer: lecturer._id,
                startDate: new Date('2024-11-01'),
                endDate: new Date('2025-02-15'),
                maxStudents: 25,
                schedule: [
                    { day: 'Tuesday', time: '11:00 AM', duration: 90 },
                    { day: 'Thursday', time: '11:00 AM', duration: 90 }
                ],
                status: 'published',
                enrolledStudents: []
            }
        ];

        const createdCourses = await Course.create(testCourses);
        console.log(`Successfully created ${createdCourses.length} test courses:`);
        createdCourses.forEach(course => {
            console.log(`- ${course.code}: ${course.title}`);
        });

        console.log('\nTest courses created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error creating test courses:', error);
        process.exit(1);
    }
}
