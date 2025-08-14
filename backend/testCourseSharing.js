const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

async function testCourseSharing() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find a lecturer
        const lecturer = await User.findOne({ role: 'lecturer' });
        console.log('Found lecturer:', {
            name: lecturer.name,
            employeeId: lecturer.academicInfo?.employeeId
        });
        
        // Create a test course
        const testCourse = new Course({
            title: 'Advanced JavaScript Programming',
            description: 'Learn advanced JavaScript concepts and modern frameworks',
            code: 'JS301',
            category: 'Computer Science',
            credits: 3,
            lecturer: lecturer._id,
            startDate: new Date('2025-01-15'),
            endDate: new Date('2025-05-15'),
            schedule: [{
                day: 'Monday',
                startTime: '10:00 AM',
                endTime: '11:30 AM',
                room: 'Room 201'
            }, {
                day: 'Wednesday',
                startTime: '10:00 AM',
                endTime: '11:30 AM',
                room: 'Room 201'
            }],
            maxStudents: 30,
            status: 'active'
        });
        
        await testCourse.save();
        console.log('Test course created:', {
            title: testCourse.title,
            code: testCourse.code,
            lecturer: lecturer.name
        });
        
        // Find all courses (this is what students would see)
        const allCourses = await Course.find({ status: 'active' })
            .populate('lecturer', 'name email')
            .populate('students', 'name email');
            
        console.log('\nAll available courses (student view):');
        allCourses.forEach(course => {
            console.log(`- ${course.title} (${course.code}) by ${course.lecturer.name}`);
            console.log(`  Enrolled students: ${course.students.length}/${course.maxStudents}`);
        });
        
        // Find courses taught by the lecturer (lecturer view)
        const lecturerCourses = await Course.find({ lecturer: lecturer._id })
            .populate('students', 'name email');
            
        console.log('\nLecturer\'s courses:');
        lecturerCourses.forEach(course => {
            console.log(`- ${course.title} (${course.code})`);
            console.log(`  Students enrolled: ${course.students.length}`);
        });
        
        // Clean up - remove test course
        await Course.findByIdAndDelete(testCourse._id);
        console.log('\nTest course removed');
        
        await mongoose.disconnect();
        console.log('\nTest completed successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.disconnect();
    }
}

testCourseSharing();
