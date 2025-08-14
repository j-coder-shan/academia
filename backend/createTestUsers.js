const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Clear existing users
        await db.collection('users').deleteMany({});
        console.log('Cleared existing users');
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Create test users directly
        const testUsers = [
            {
                name: 'John Student',
                email: 'john.student@academia.edu',
                password: hashedPassword,
                role: 'student',
                academicInfo: {
                    studentId: 'stu001',
                    department: '',
                    specialization: ''
                },
                isActive: true,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Jane Lecturer',
                email: 'jane.lecturer@academia.edu',
                password: hashedPassword,
                role: 'lecturer',
                academicInfo: {
                    employeeId: 'lec001',
                    department: '',
                    specialization: ''
                },
                isActive: true,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        await db.collection('users').insertMany(testUsers);
        console.log('Created test users:');
        console.log('- Student: stu001 / password123');
        console.log('- Lecturer: lec001 / password123');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestUser();
