const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
require('dotenv').config();

console.log('Starting database verification and course management...');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.log('Connection error:', error);
    return false;
  }
};

const manageCourses = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('Failed to connect to database');
      return;
    }
    
    // Check for existing lecturers in the database
    const lecturers = await User.find({ role: 'lecturer' });
    console.log(`Found ${lecturers.length} lecturer(s) in the database`);
    
    if (lecturers.length === 0) {
      console.log('No lecturers found in database. Please register lecturers through the UI first.');
      console.log('Visit http://localhost:3000/html/auth/register.html to register a lecturer.');
      return;
    }
    
    // Display all lecturers
    console.log('\nExisting lecturers:');
    lecturers.forEach((lecturer, index) => {
      console.log(`${index + 1}. ${lecturer.name} (${lecturer.email})`);
    });
    
    // Check for existing courses
    const existingCourses = await Course.find({});
    console.log(`\nFound ${existingCourses.length} course(s) in the database`);
    
    if (existingCourses.length > 0) {
      console.log('\nExisting courses:');
      existingCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course.code}) - Status: ${course.status}`);
        console.log(`   Lecturer: ${course.lecturer}`);
        console.log(`   Students enrolled: ${course.students ? course.students.length : 0}`);
      });
      
      // Ensure all courses are active
      const inactiveCourses = await Course.find({ status: { $ne: 'active' } });
      if (inactiveCourses.length > 0) {
        console.log(`\nActivating ${inactiveCourses.length} inactive course(s)...`);
        await Course.updateMany({ status: { $ne: 'active' } }, { status: 'active' });
        console.log('All courses are now active');
      }
    } else {
      console.log('No courses found in database. Please create courses through the UI first.');
      console.log('Visit http://localhost:3000/html/lecturer/dashboard.html to create courses.');
    }
    
    // List all active courses for browsing
    const activeCourses = await Course.find({ status: 'active' });
    console.log(`\nActive courses available for student enrollment: ${activeCourses.length}`);
    if (activeCourses.length > 0) {
      activeCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course.code})`);
        console.log(`   Students enrolled: ${course.students ? course.students.length : 0}/${course.maxStudents || 'unlimited'}`);
      });
    }
    
    // Check for students in the database
    const students = await User.find({ role: 'student' });
    console.log(`\nFound ${students.length} student(s) in the database`);
    
    if (students.length > 0) {
      console.log('\nStudents available for course enrollment:');
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.email})`);
      });
    } else {
      console.log('No students found. Students can register at http://localhost:3000/html/auth/register.html');
    }
    
    console.log('\n=== Database Verification Completed ===');
    console.log('All data shown above is real database data (no mock data)');
    console.log('To create courses: Visit lecturer dashboard');
    console.log('To enroll students: Students can browse and enroll through the courses page');
    console.log('To create presentations: Lecturers can create presentations from their dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during database operations:', error);
    process.exit(1);
  }
};

manageCourses();
