const mongoose = require('mongoose');
const User = require('./models/userModel');
const Course = require('./models/courseModel');
const Presentation = require('./models/presentationModel');

async function quickCheck() {
    try {
        await mongoose.connect('mongodb://localhost:27017/academia_lms');

        console.log('🔍 Quick Check - Student Presentations Issue\n');

        // 1. Check students
        const students = await User.find({ role: 'student' });
        console.log(`Students: ${students.length}`);
        for (const student of students) {
            console.log(`  - ${student.name} (${student._id})`);
        }

        // 2. Check courses with enrolled students
        const courses = await Course.find({});
        console.log(`\nCourses: ${courses.length}`);
        for (const course of courses) {
            console.log(`  - ${course.name} (${course.code})`);
            console.log(`    Students enrolled: ${course.students?.length || 0}`);
            if (course.students && course.students.length > 0) {
                for (const studentId of course.students) {
                    const student = await User.findById(studentId);
                    console.log(`      * ${student?.name || 'Unknown'} (${studentId})`);
                }
            }
        }

        // 3. Check presentations
        const presentations = await Presentation.find({});
        console.log(`\nPresentations: ${presentations.length}`);
        for (const presentation of presentations) {
            const course = await Course.findById(presentation.course);
            const lecturer = await User.findById(presentation.lecturer);
            console.log(`  - "${presentation.title}"`);
            console.log(`    Course: ${course?.name || 'Unknown'}`);
            console.log(`    Lecturer: ${lecturer?.name || 'Unknown'}`);
            console.log(`    Status: ${presentation.status}`);
        }

        // 4. Test the exact query used by getStudentPresentations
        console.log('\n🔍 Testing student presentation query for each student:');
        for (const student of students) {
            console.log(`\nStudent: ${student.name}`);
            
            // Find courses where student is enrolled
            const enrolledCourses = await Course.find({
                students: student._id,
                status: 'active'
            });
            console.log(`  Enrolled courses: ${enrolledCourses.length}`);
            
            if (enrolledCourses.length > 0) {
                const courseIds = enrolledCourses.map(c => c._id);
                
                // Find presentations for these courses
                const studentPresentations = await Presentation.find({
                    course: { $in: courseIds },
                    status: { $in: ['published', 'active'] }
                });
                
                console.log(`  Presentations available: ${studentPresentations.length}`);
                for (const p of studentPresentations) {
                    const course = await Course.findById(p.course);
                    console.log(`    ✅ "${p.title}" (${course?.name})`);
                }
            } else {
                console.log(`  ❌ Not enrolled in any active courses`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

quickCheck();
