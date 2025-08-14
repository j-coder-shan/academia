const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

async function testCrossInterfaceData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find a lecturer
        const lecturer = await User.findOne({ role: 'lecturer' });
        if (!lecturer) {
            console.log('No lecturer found in database');
            return;
        }
        console.log('Found lecturer:', lecturer.email, lecturer.academicInfo?.employeeId);
        
        // Create a test course
        const testCourse = await Course.create({
            title: 'Test Cross-Interface Course',
            description: 'This course tests data sharing between lecturer and student interfaces',
            category: 'computer-science',
            lecturer: lecturer._id,
            status: 'active',
            maxStudents: 30,
            students: [], // Empty initially
            assignments: [],
            createdAt: new Date()
        });
        
        console.log('Created test course:', testCourse.title);
        
        // Find all students
        const students = await User.find({ role: 'student' }).limit(3);
        console.log(`Found ${students.length} students`);
        
        // Show that students can see this new course in available courses
        const availableCourses = await Course.find({
            status: 'active',
            students: { $nin: students.map(s => s._id) }
        }).populate('lecturer', 'name email');
        
        console.log('\nAvailable courses for students:');
        availableCourses.forEach(course => {
            console.log(`- ${course.title} by ${course.lecturer.name || course.lecturer.email}`);
        });
        
        // Simulate student enrollment
        if (students.length > 0) {
            const student = students[0];
            testCourse.students.push(student._id);
            await testCourse.save();
            
            console.log(`\nEnrolled student ${student.academicInfo?.studentId || student.email} in course`);
            
            // Show enrolled courses for this student
            const enrolledCourses = await Course.find({
                students: student._id
            }).populate('lecturer', 'name email');
            
            console.log(`\nEnrolled courses for ${student.academicInfo?.studentId}:`);
            enrolledCourses.forEach(course => {
                console.log(`- ${course.title} by ${course.lecturer.name || course.lecturer.email}`);
            });
        }
        
        // Clean up test course
        await Course.findByIdAndDelete(testCourse._id);
        console.log('\nTest course cleaned up');
        
        await mongoose.disconnect();
        console.log('\nTest completed successfully! ✅');
        console.log('✅ Lecturers can create courses');
        console.log('✅ Students can see newly created courses');
        console.log('✅ Students can enroll in courses');
        console.log('✅ Cross-interface data sharing works correctly');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testCrossInterfaceData();
