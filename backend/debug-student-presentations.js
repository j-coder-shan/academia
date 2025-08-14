const mongoose = require('mongoose');
const User = require('./models/userModel');
const Course = require('./models/courseModel');
const Presentation = require('./models/presentationModel');

async function debugStudentPresentations() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/academia_lms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔍 Debugging Student Presentations Visibility...\n');

        // 1. Check all students
        const students = await User.find({ role: 'student' });
        console.log(`📊 Found ${students.length} students:`);
        students.forEach(student => {
            console.log(`  - ${student.name} (ID: ${student._id}) - Enrolled Courses: ${student.enrolledCourses?.length || 0}`);
        });

        // 2. Check all courses with enrollments
        const courses = await Course.find({}).populate('students', 'name email');
        console.log(`\n📚 Found ${courses.length} courses:`);
        courses.forEach(course => {
            console.log(`  - ${course.name} (${course.code}) - ${course.students?.length || 0} enrolled students`);
            if (course.students && course.students.length > 0) {
                course.students.forEach(student => {
                    console.log(`    * ${student.name} (${student.email})`);
                });
            }
        });

        // 3. Check all presentations
        const presentations = await Presentation.find({})
            .populate('course', 'name code students')
            .populate('lecturer', 'name email');
        console.log(`\n📋 Found ${presentations.length} presentations:`);
        presentations.forEach(presentation => {
            console.log(`  - "${presentation.title}" by ${presentation.lecturer.name}`);
            console.log(`    Course: ${presentation.course.name} (${presentation.course.code})`);
            console.log(`    Status: ${presentation.status}`);
            console.log(`    Course has ${presentation.course.students?.length || 0} enrolled students`);
            console.log(`    Selected Students: ${presentation.selectedStudents?.length || 0}`);
        });

        // 4. Test student presentation visibility for each student
        console.log('\n🔍 Testing presentation visibility for each student:');
        
        for (const student of students) {
            console.log(`\n👤 Student: ${student.name}`);
            
            // Get student with populated courses
            const fullStudent = await User.findById(student._id).populate('enrolledCourses');
            const enrolledCourseIds = fullStudent.enrolledCourses?.map(course => course._id) || [];
            
            console.log(`  Enrolled in ${enrolledCourseIds.length} courses:`);
            fullStudent.enrolledCourses?.forEach(course => {
                console.log(`    - ${course.name} (${course.code})`);
            });

            // Find presentations for this student
            const studentPresentations = await Presentation.find({
                course: { $in: enrolledCourseIds },
                status: { $in: ['published', 'active'] }
            })
            .populate('course', 'name code')
            .populate('lecturer', 'name email');

            console.log(`  Should see ${studentPresentations.length} presentations:`);
            studentPresentations.forEach(presentation => {
                console.log(`    ✅ "${presentation.title}" (Course: ${presentation.course.name})`);
            });
        }

        // 5. Check if students are actually enrolled in courses with presentations
        console.log('\n🔄 Cross-checking course enrollments...');
        
        for (const course of courses) {
            const coursePresentations = await Presentation.find({ course: course._id });
            if (coursePresentations.length > 0) {
                console.log(`\n📚 Course "${course.name}" has ${coursePresentations.length} presentations:`);
                coursePresentations.forEach(p => {
                    console.log(`  - "${p.title}" (Status: ${p.status})`);
                });
                
                console.log(`  Students enrolled in this course:`);
                if (course.students && course.students.length > 0) {
                    course.students.forEach(student => {
                        console.log(`    ✅ ${student.name}`);
                    });
                } else {
                    console.log(`    ❌ No students enrolled!`);
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Debug error:', error);
        process.exit(1);
    }
}

debugStudentPresentations();
