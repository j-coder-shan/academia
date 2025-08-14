const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
const Presentation = require('./models/presentationModel');
const Notification = require('./models/notificationModel');
require('dotenv').config();

// Comprehensive test for presentation workflow with real data only
const testPresentationWorkflow = async () => {
    try {
        console.log('🧪 === Testing Presentation Workflow (Real Data Only) ===\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // 1. Check existing data
        console.log('📊 CHECKING EXISTING DATABASE DATA:');
        const lecturers = await User.find({ role: 'lecturer' });
        const students = await User.find({ role: 'student' });
        const courses = await Course.find({}).populate('lecturer', 'name').populate('students', 'name');
        const presentations = await Presentation.find({}).populate('course', 'title').populate('lecturer', 'name');
        
        console.log(`👨‍🏫 Lecturers: ${lecturers.length}`);
        console.log(`🎓 Students: ${students.length}`);
        console.log(`📚 Courses: ${courses.length}`);
        console.log(`🎤 Presentations: ${presentations.length}\n`);
        
        if (lecturers.length === 0) {
            console.log('❌ No lecturers found! Please register lecturers first.');
            console.log('📝 Visit: http://localhost:3000/html/auth/register.html\n');
        }
        
        if (students.length === 0) {
            console.log('❌ No students found! Please register students first.');
            console.log('📝 Visit: http://localhost:3000/html/auth/register.html\n');
        }
        
        if (courses.length === 0) {
            console.log('❌ No courses found! Please create courses first.');
            console.log('📝 Lecturers can create courses from their dashboard.\n');
        }
        
        // 2. Show detailed course information (including enrolled students)
        console.log('📚 COURSE DETAILS:');
        courses.forEach((course, index) => {
            console.log(`${index + 1}. ${course.title} (${course.code})`);
            console.log(`   📋 Status: ${course.status}`);
            console.log(`   👨‍🏫 Lecturer: ${course.lecturer?.name || 'Unknown'}`);
            console.log(`   🎓 Enrolled Students: ${course.students?.length || 0}`);
            if (course.students && course.students.length > 0) {
                course.students.forEach((student, i) => {
                    console.log(`      ${i + 1}. ${student.name}`);
                });
            }
            console.log('');
        });
        
        // 3. Show presentation details
        console.log('🎤 PRESENTATION DETAILS:');
        if (presentations.length === 0) {
            console.log('   No presentations found yet.\n');
        } else {
            presentations.forEach((presentation, index) => {
                console.log(`${index + 1}. ${presentation.title}`);
                console.log(`   📚 Course: ${presentation.course?.title || 'Unknown'}`);
                console.log(`   👨‍🏫 Lecturer: ${presentation.lecturer?.name || 'Unknown'}`);
                console.log(`   📅 Due Date: ${presentation.schedule?.dueDate || 'Not set'}`);
                console.log(`   📊 Status: ${presentation.status}`);
                console.log(`   🔔 Notifications Sent: ${presentation.notifications?.length || 0}`);
                console.log('');
            });
        }
        
        // 4. Check notifications
        const notifications = await Notification.find({})
            .populate('recipient', 'name role')
            .populate('sender', 'name')
            .sort({ createdAt: -1 });
            
        console.log(`🔔 NOTIFICATIONS: ${notifications.length} total`);
        const presentationNotifications = notifications.filter(n => 
            n.type.includes('presentation')
        );
        console.log(`   📑 Presentation-related: ${presentationNotifications.length}`);
        
        if (presentationNotifications.length > 0) {
            console.log('   Recent presentation notifications:');
            presentationNotifications.slice(0, 5).forEach((notification, index) => {
                console.log(`   ${index + 1}. To: ${notification.recipient?.name} (${notification.recipient?.role})`);
                console.log(`      From: ${notification.sender?.name}`);
                console.log(`      Type: ${notification.type}`);
                console.log(`      Title: ${notification.title}`);
                console.log(`      Date: ${notification.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }
        
        // 5. Verify presentation visibility for students
        console.log('👀 STUDENT PRESENTATION VISIBILITY:');
        for (const student of students) {
            const studentDoc = await User.findById(student._id).populate('enrolledCourses');
            const enrolledCourseIds = studentDoc.enrolledCourses?.map(c => c._id) || [];
            
            const visiblePresentations = await Presentation.find({
                course: { $in: enrolledCourseIds },
                status: { $in: ['published', 'active'] }
            });
            
            console.log(`   ${student.name}:`);
            console.log(`     🎓 Enrolled Courses: ${enrolledCourseIds.length}`);
            console.log(`     🎤 Visible Presentations: ${visiblePresentations.length}`);
            
            if (visiblePresentations.length > 0) {
                visiblePresentations.forEach((pres, i) => {
                    console.log(`       ${i + 1}. ${pres.title}`);
                });
            }
            console.log('');
        }
        
        // 6. Test workflow summary
        console.log('🔄 WORKFLOW TEST SUMMARY:');
        console.log('✅ Database connectivity: Working');
        console.log(`📊 Data integrity: ${lecturers.length > 0 && students.length > 0 && courses.length > 0 ? 'Good' : 'Needs setup'}`);
        console.log(`🎤 Presentation system: ${presentations.length > 0 ? 'Active' : 'Ready for use'}`);
        console.log(`🔔 Notification system: ${notifications.length > 0 ? 'Active' : 'Ready for use'}`);
        
        console.log('\n📋 NEXT STEPS FOR TESTING:');
        console.log('1. Register lecturers and students if not done');
        console.log('2. Create courses and enroll students');
        console.log('3. Create presentations from lecturer dashboard');
        console.log('4. Verify presentations appear in student dashboard');
        console.log('5. Check notifications are sent to enrolled students');
        console.log('6. Verify presentation counts update in real-time');
        
        console.log('\n🌐 FRONTEND URLS:');
        console.log('📝 Registration: http://localhost:3000/html/auth/register.html');
        console.log('🔐 Login: http://localhost:3000/html/auth/login.html');
        console.log('👨‍🏫 Lecturer Dashboard: http://localhost:3000/html/lecturer/dashboard.html');
        console.log('🎓 Student Dashboard: http://localhost:3000/html/student/dashboard.html');
        console.log('📚 Student Courses: http://localhost:3000/html/student/courses.html');
        console.log('🎤 Student Presentations: http://localhost:3000/html/student/presentations.html');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📝 Database connection closed');
        process.exit(0);
    }
};

testPresentationWorkflow();
