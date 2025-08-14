const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
const Presentation = require('./models/presentationModel');
require('dotenv').config();

// Simple database verification script - uses ONLY real data
const verifyDatabase = async () => {
  try {
    console.log('=== Academia LMS Database Verification ===');
    console.log('This script shows ONLY real database data (no mock data)\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Check Users
    const lecturers = await User.find({ role: 'lecturer' });
    const students = await User.find({ role: 'student' });
    
    console.log(`📚 LECTURERS: ${lecturers.length} found`);
    lecturers.forEach((lecturer, i) => {
      console.log(`  ${i + 1}. ${lecturer.name} (${lecturer.email})`);
    });
    
    console.log(`\n🎓 STUDENTS: ${students.length} found`);
    students.forEach((student, i) => {
      console.log(`  ${i + 1}. ${student.name} (${student.email})`);
    });
    
    // Check Courses
    const courses = await Course.find({}).populate('lecturer', 'name email');
    console.log(`\n📖 COURSES: ${courses.length} found`);
    courses.forEach((course, i) => {
      const enrolledCount = course.students ? course.students.length : 0;
      console.log(`  ${i + 1}. ${course.title} (${course.code})`);
      console.log(`     Status: ${course.status}`);
      console.log(`     Lecturer: ${course.lecturer ? course.lecturer.name : 'Unknown'}`);
      console.log(`     Students: ${enrolledCount}/${course.maxStudents || 'unlimited'}`);
    });
    
    // Check Presentations
    const presentations = await Presentation.find({})
      .populate('lecturer', 'name')
      .populate('course', 'title code');
    
    console.log(`\n🎤 PRESENTATIONS: ${presentations.length} found`);
    presentations.forEach((presentation, i) => {
      const selectedCount = presentation.selectedStudents ? presentation.selectedStudents.length : 0;
      console.log(`  ${i + 1}. ${presentation.title}`);
      console.log(`     Course: ${presentation.course ? presentation.course.title : 'Unknown'}`);
      console.log(`     Lecturer: ${presentation.lecturer ? presentation.lecturer.name : 'Unknown'}`);
      console.log(`     Selected Students: ${selectedCount}`);
      console.log(`     Date: ${presentation.date ? presentation.date.toDateString() : 'Not set'}`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Users: ${lecturers.length + students.length} (${lecturers.length} lecturers, ${students.length} students)`);
    console.log(`Total Courses: ${courses.length}`);
    console.log(`Total Presentations: ${presentations.length}`);
    
    if (lecturers.length === 0) {
      console.log('\n⚠️  No lecturers found. Register lecturers at: http://localhost:3000/html/auth/register.html');
    }
    
    if (students.length === 0) {
      console.log('\n⚠️  No students found. Register students at: http://localhost:3000/html/auth/register.html');
    }
    
    if (courses.length === 0) {
      console.log('\n⚠️  No courses found. Create courses from lecturer dashboard.');
    }
    
    console.log('\n✅ All data above is from the real database (no mock/test data)');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
};

verifyDatabase();
