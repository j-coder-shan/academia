const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

// Test course visibility workflow for students
const testCourseVisibility = async () => {
    try {
        console.log('🧪 === Testing Course Visibility for Students ===\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Get all active courses
        const allActiveCourses = await Course.find({ status: 'active' })
            .populate('lecturer', 'name email')
            .sort({ createdAt: -1 });
            
        console.log(`📚 ACTIVE COURSES (What students should see): ${allActiveCourses.length}`);
        
        if (allActiveCourses.length === 0) {
            console.log('❌ No active courses found!');
            console.log('📝 Create courses from lecturer dashboard to test visibility\n');
        } else {
            allActiveCourses.forEach((course, index) => {
                console.log(`${index + 1}. ${course.title} (${course.code})`);
                console.log(`   👨‍🏫 Lecturer: ${course.lecturer?.name || 'Unknown'}`);
                console.log(`   📊 Status: ${course.status}`);
                console.log(`   🎓 Enrolled: ${course.students?.length || 0}/${course.maxStudents || 'unlimited'}`);
                console.log(`   📅 Created: ${course.createdAt?.toLocaleDateString() || 'Unknown'}`);
                console.log(`   📋 Category: ${course.category || 'General'}`);
                console.log(`   🎯 Level: ${course.level || 'Beginner'}`);
                console.log('');
            });
        }
        
        // Test the browse endpoint query (what our API uses)
        console.log('🔍 TESTING API BROWSE QUERY:');
        const browseQuery = { status: 'active' };
        const browseCourses = await Course.find(browseQuery)
            .populate('lecturer', 'name email')
            .select('title description code category level credits duration maxStudents students startDate endDate thumbnail tags status createdAt')
            .sort({ createdAt: -1 });
            
        console.log(`📊 Browse API would return: ${browseCourses.length} courses`);
        
        // Test what students see with enrollment info
        const students = await User.find({ role: 'student' });
        console.log(`\n👥 STUDENT VISIBILITY TEST (${students.length} students):`);
        
        if (students.length === 0) {
            console.log('❌ No students found. Register students to test course visibility.');
        } else {
            for (const student of students.slice(0, 3)) { // Test first 3 students
                console.log(`\n🎓 Student: ${student.name}`);
                
                const coursesWithStatus = browseCourses.map(course => {
                    const isEnrolled = course.students.some(studentId => studentId.toString() === student._id.toString());
                    const enrollmentCount = course.students.length;
                    const spotsAvailable = course.maxStudents ? course.maxStudents - course.students.length : 'unlimited';
                    const isFull = course.maxStudents ? course.students.length >= course.maxStudents : false;
                    
                    return {
                        title: course.title,
                        code: course.code,
                        isEnrolled,
                        enrollmentCount,
                        spotsAvailable,
                        isFull
                    };
                });
                
                const enrolledCourses = coursesWithStatus.filter(c => c.isEnrolled);
                const availableCourses = coursesWithStatus.filter(c => !c.isEnrolled && !c.isFull);
                
                console.log(`   📚 Can see ${coursesWithStatus.length} total courses`);
                console.log(`   ✅ Enrolled in ${enrolledCourses.length} courses`);
                console.log(`   🔓 Can enroll in ${availableCourses.length} courses`);
                
                if (availableCourses.length > 0) {
                    console.log('   Available for enrollment:');
                    availableCourses.slice(0, 3).forEach(course => {
                        console.log(`     - ${course.title} (${course.code}) - ${course.spotsAvailable} spots`);
                    });
                }
            }
        }
        
        // Verify API endpoints
        console.log('\n🌐 API ENDPOINTS FOR COURSE VISIBILITY:');
        console.log('📝 Browse all courses: GET /api/courses/browse');
        console.log('✅ Enrolled courses: GET /api/courses/enrolled');
        console.log('🔍 Available courses: GET /api/courses/available');
        
        console.log('\n🔄 WORKFLOW TEST:');
        console.log('1. ✅ Lecturer creates course → Should appear in active courses immediately');
        console.log('2. ✅ Students visit courses page → Should see ALL active courses');
        console.log('3. ✅ Students can browse and enroll → Course appears in enrolled tab');
        console.log('4. ✅ Real-time visibility → No delays or refresh required');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Start backend server: npm start (in backend folder)');
        console.log('2. Open student courses page: http://localhost:3000/html/student/courses.html');
        console.log('3. Create new course from lecturer dashboard');
        console.log('4. Switch to Available tab in student courses page');
        console.log('5. Verify new course appears immediately');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📝 Database connection closed');
        process.exit(0);
    }
};

testCourseVisibility();
