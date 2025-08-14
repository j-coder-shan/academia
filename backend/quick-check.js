const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

// Quick check of courses in database
const quickCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 QUICK DATABASE CHECK\n');
        
        const totalCourses = await Course.countDocuments();
        const activeCourses = await Course.countDocuments({ status: 'active' });
        const lecturers = await User.countDocuments({ role: 'lecturer' });
        
        console.log(`👨‍🏫 Lecturers: ${lecturers}`);
        console.log(`📚 Total Courses: ${totalCourses}`);
        console.log(`✅ Active Courses: ${activeCourses}\n`);
        
        if (totalCourses > 0) {
            console.log('📋 ALL COURSES:');
            const allCourses = await Course.find({})
                .populate('lecturer', 'name email')
                .select('title code status lecturer createdAt');
                
            allCourses.forEach((course, i) => {
                console.log(`${i + 1}. ${course.code || 'NO-CODE'} - ${course.title}`);
                console.log(`   Status: ${course.status}`);
                console.log(`   Lecturer: ${course.lecturer?.name || 'Unknown'} (${course.lecturer?.email || 'No email'})`);
                console.log(`   Created: ${course.createdAt?.toDateString() || 'Unknown'}\n`);
            });
            
            console.log('✅ Courses exist and should appear in presentation dropdown!');
        } else {
            console.log('❌ NO COURSES FOUND!');
            console.log('📝 Create courses first at: http://localhost:3000/html/lecturer/dashboard.html');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

quickCheck();
