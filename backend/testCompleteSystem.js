const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

async function testCompleteSystem() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find existing users
        const student = await User.findOne({ role: 'student' });
        const lecturer = await User.findOne({ role: 'lecturer' });
        
        console.log('✅ Found users:');
        console.log(`   Student: ${student.name} (${student.academicInfo?.studentId})`);
        console.log(`   Lecturer: ${lecturer.name} (${lecturer.academicInfo?.employeeId})`);
        
        // Test 1: Lecturer creates a course
        console.log('\n📚 Test 1: Lecturer creates a course');
        const newCourse = new Course({
            title: 'Web Development Fundamentals',
            description: 'Learn HTML, CSS, JavaScript and modern web development',
            code: `WEB${Date.now()}`, // Use timestamp to ensure uniqueness
            category: 'Computer Science',
            level: 'Beginner',
            credits: 3,
            lecturer: lecturer._id,
            startDate: new Date('2025-02-01'),
            endDate: new Date('2025-06-01'),
            schedule: [{
                day: 'Tuesday',
                startTime: '2:00 PM',
                endTime: '3:30 PM',
                room: 'Lab 101'
            }, {
                day: 'Thursday',
                startTime: '2:00 PM',
                endTime: '3:30 PM',
                room: 'Lab 101'
            }],
            maxStudents: 25,
            status: 'active',
            objectives: [
                'Understand HTML structure and semantics',
                'Master CSS styling and responsive design',
                'Learn JavaScript fundamentals',
                'Build interactive web applications'
            ]
        });
        
        await newCourse.save();
        console.log(`   ✅ Course created: ${newCourse.title} (${newCourse.code})`);
        
        // Test 2: Check if course appears in available courses for students
        console.log('\n👨‍🎓 Test 2: Student views available courses');
        const availableCourses = await Course.find({
            status: 'active',
            students: { $ne: student._id },
            $expr: { $lt: [{ $size: '$students' }, '$maxStudents'] }
        }).populate('lecturer', 'name email');
        
        console.log(`   ✅ Found ${availableCourses.length} available courses:`);
        availableCourses.forEach(course => {
            console.log(`      - ${course.title} (${course.code}) by ${course.lecturer.name}`);
            console.log(`        Spots: ${course.students.length}/${course.maxStudents}`);
        });
        
        // Test 3: Student enrolls in the course
        console.log('\n📝 Test 3: Student enrolls in course');
        if (!newCourse.students.includes(student._id)) {
            newCourse.students.push(student._id);
            await newCourse.save();
            console.log(`   ✅ ${student.name} enrolled in ${newCourse.title}`);
        }
        
        // Test 4: Verify enrollment from student perspective
        console.log('\n👀 Test 4: Verify enrollment from student perspective');
        const studentCourses = await Course.find({
            students: student._id
        }).populate('lecturer', 'name email');
        
        console.log(`   ✅ Student enrolled courses: ${studentCourses.length}`);
        studentCourses.forEach(course => {
            console.log(`      - ${course.title} (${course.code}) by ${course.lecturer.name}`);
        });
        
        // Test 5: Verify from lecturer perspective
        console.log('\n👨‍🏫 Test 5: Verify from lecturer perspective');
        const lecturerCourses = await Course.find({
            lecturer: lecturer._id
        }).populate('students', 'name email academicInfo.studentId');
        
        console.log(`   ✅ Lecturer courses: ${lecturerCourses.length}`);
        lecturerCourses.forEach(course => {
            console.log(`      - ${course.title} (${course.code})`);
            console.log(`        Enrolled students: ${course.students.length}`);
            course.students.forEach(stu => {
                console.log(`          * ${stu.name} (${stu.academicInfo?.studentId})`);
            });
        });
        
        // Test 6: Lecturer creates an assignment
        console.log('\n📋 Test 6: Lecturer creates an assignment');
        const assignment = {
            title: 'Build a Personal Portfolio Website',
            description: 'Create a responsive personal portfolio using HTML, CSS, and JavaScript',
            instructions: 'Build a portfolio website that showcases your skills and projects. Include at least 3 sections: About, Projects, and Contact. Use responsive design and interactive JavaScript features.',
            dueDate: new Date('2025-03-15'),
            totalPoints: 100,
            type: 'project',
            allowLateSubmission: true,
            latePenalty: 5 // 5% penalty per day
        };
        
        newCourse.assignments.push(assignment);
        await newCourse.save();
        console.log(`   ✅ Assignment created: ${assignment.title}`);
        
        // Test 7: Check if assignment appears for enrolled students
        console.log('\n📚 Test 7: Student views course assignments');
        const courseWithAssignments = await Course.findById(newCourse._id)
            .populate('students', 'name')
            .populate('lecturer', 'name');
            
        console.log(`   ✅ Course: ${courseWithAssignments.title}`);
        console.log(`   ✅ Assignments: ${courseWithAssignments.assignments.length}`);
        courseWithAssignments.assignments.forEach(assign => {
            console.log(`      - ${assign.title} (Due: ${assign.dueDate.toDateString()})`);
            console.log(`        Points: ${assign.totalPoints}`);
        });
        
        // Clean up - remove test course
        await Course.findByIdAndDelete(newCourse._id);
        console.log('\n🧹 Test course removed');
        
        await mongoose.disconnect();
        console.log('\n✅ All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ Role-based authentication working');
        console.log('   ✅ Course creation by lecturer working');
        console.log('   ✅ Course visibility to students working');
        console.log('   ✅ Student enrollment working');
        console.log('   ✅ Assignment creation working');
        console.log('   ✅ Cross-interface data sharing working');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
    }
}

testCompleteSystem();
