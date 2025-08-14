const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

async function createTestUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hashanprabboth:joJsyByBQJD6MroR@cluster0.fx1he1t.mongodb.net/academia_lms?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔧 Setting up test users...\n');

        // Delete existing test users to avoid conflicts
        await User.deleteMany({ 
            $or: [
                { email: 'lecturer@test.com' },
                { email: 'student@test.com' }
            ]
        });

        // Create lecturer user
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const lecturer = new User({
            name: 'Test Lecturer',
            email: 'lecturer@test.com',
            password: hashedPassword,
            role: 'lecturer',
            academicInfo: {
                employeeId: 'LEC001',
                department: 'Computer Science'
            },
            isActive: true
        });

        const student = new User({
            name: 'Test Student',
            email: 'student@test.com',
            password: hashedPassword,
            role: 'student',
            academicInfo: {
                studentId: 'STU001',
                department: 'Computer Science',
                yearOfStudy: 2
            },
            isActive: true
        });

        await lecturer.save();
        await student.save();

        console.log('✅ Created test users:');
        console.log('📚 Lecturer: lecturer@test.com / 123456 (Employee ID: LEC001)');
        console.log('🎓 Student: student@test.com / 123456 (Student ID: STU001)');
        
        // Also fix the existing shanx user to be a lecturer
        const existingUser = await User.findOne({ name: 'shanx' });
        if (existingUser) {
            existingUser.role = 'lecturer';
            existingUser.academicInfo = existingUser.academicInfo || {};
            existingUser.academicInfo.employeeId = existingUser.academicInfo.employeeId || 'LEC002';
            await existingUser.save();
            console.log('🔧 Updated shanx to lecturer role');
        }

        // List all users
        console.log('\n📋 All users in database:');
        const allUsers = await User.find({}).select('name email role academicInfo.studentId academicInfo.employeeId');
        allUsers.forEach((user, index) => {
            const id = user.academicInfo?.studentId || user.academicInfo?.employeeId || 'No ID';
            console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUsers();
