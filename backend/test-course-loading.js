const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

// Test course loading for presentation creation
const testCourseLoading = async () => {
    try {
        console.log('🧪 === Testing Course Loading for Presentation Creation ===\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find all lecturers
        const lecturers = await User.find({ role: 'lecturer' });
        console.log(`👨‍🏫 Found ${lecturers.length} lecturer(s) in the database\n`);
        
        if (lecturers.length === 0) {
            console.log('❌ No lecturers found! Please register lecturers first.');
            console.log('📝 Visit: http://localhost:3000/html/auth/register.html\n');
            return;
        }
        
        // For each lecturer, find their courses
        for (const lecturer of lecturers) {
            console.log(`📚 COURSES FOR LECTURER: ${lecturer.name} (${lecturer.email})`);
            
            const lecturerCourses = await Course.find({ lecturer: lecturer._id })
                .select('title code category status students maxStudents')
                .sort({ createdAt: -1 });
            
            console.log(`   📊 Total courses: ${lecturerCourses.length}`);
            
            if (lecturerCourses.length === 0) {
                console.log('   ❌ No courses found for this lecturer');
                console.log('   📝 Lecturer should create courses from dashboard: http://localhost:3000/html/lecturer/dashboard.html');
            } else {
                console.log('   📋 Course List:');
                lecturerCourses.forEach((course, index) => {
                    console.log(`   ${index + 1}. ${course.code || 'N/A'} - ${course.title}`);
                    console.log(`      📊 Status: ${course.status}`);
                    console.log(`      🎓 Students: ${course.students?.length || 0}/${course.maxStudents || 'unlimited'}`);
                    console.log(`      📂 Category: ${course.category || 'N/A'}`);
                });
            }
            console.log('');
        }
        
        // Test API endpoint that frontend will use
        console.log('🔌 TESTING API ENDPOINT SIMULATION:');
        console.log('Endpoint: GET /api/courses (with lecturer authentication)');
        
        for (const lecturer of lecturers) {
            const apiResponse = await Course.find({ lecturer: lecturer._id });
            console.log(`\n👨‍🏫 API Response for ${lecturer.name}:`);
            console.log(`   📊 courses.length: ${apiResponse.length}`);
            
            if (apiResponse.length > 0) {
                console.log('   📋 Available for dropdown:');
                apiResponse.forEach((course, index) => {
                    const displayText = `${course.code || 'N/A'} - ${course.title}`;
                    console.log(`   ${index + 1}. <option value="${course._id}">${displayText}</option>`);
                });
            } else {
                console.log('   ❌ No courses available for presentation creation');
                console.log('   📝 Dropdown should show: "No courses available - Create a course first"');
            }
        }
        
        console.log('\n🔧 FRONTEND INTEGRATION CHECK:');
        console.log('✅ API Endpoint: /api/courses');
        console.log('✅ Authentication: Bearer token from localStorage.getItem("authToken")');
        console.log('✅ Response format: { success: true, courses: [...] }');
        console.log('✅ Dropdown population: course.code - course.title');
        console.log('✅ Course ID: course._id');
        
        console.log('\n📋 TROUBLESHOOTING STEPS:');
        console.log('1. ✅ Check if lecturers exist in database');
        console.log('2. ✅ Check if courses exist for the lecturer');
        console.log('3. ✅ Verify API endpoint returns lecturer\'s courses');
        console.log('4. ✅ Verify frontend uses correct token and endpoint');
        console.log('5. ✅ Check browser console for API errors');
        
        console.log('\n🌐 URLS FOR TESTING:');
        console.log('📝 Register Lecturer: http://localhost:3000/html/auth/register.html');
        console.log('📊 Lecturer Dashboard: http://localhost:3000/html/lecturer/dashboard.html');
        console.log('🎤 Create Presentation: http://localhost:3000/html/lecturer/presentations.html');
        
        // Summary
        const totalCourses = await Course.countDocuments();
        const activeCourses = await Course.countDocuments({ status: 'active' });
        
        console.log('\n📊 DATABASE SUMMARY:');
        console.log(`👨‍🏫 Lecturers: ${lecturers.length}`);
        console.log(`📚 Total Courses: ${totalCourses}`);
        console.log(`✅ Active Courses: ${activeCourses}`);
        console.log(`🎤 Ready for Presentations: ${activeCourses > 0 ? 'Yes' : 'No'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📝 Database connection closed');
        process.exit(0);
    }
};

testCourseLoading();
