const mongoose = require('mongoose');
const Course = require('./models/courseModel');
require('dotenv').config();

console.log('Starting course test script...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const testCourses = async () => {
  try {
    await connectDB();
    
    // Get all courses
    const allCourses = await Course.find({});
    console.log('Total courses in database:', allCourses.length);
    
    if (allCourses.length > 0) {
      console.log('\nAll courses:');
      allCourses.forEach((course, index) => {
        console.log(`${index + 1}. Title: ${course.title}`);
        console.log(`   Status: ${course.status}`);
        console.log(`   Code: ${course.code}`);
        console.log(`   Students enrolled: ${course.students.length}`);
        console.log(`   Max students: ${course.maxStudents}`);
        console.log(`   Created: ${course.createdAt}`);
        console.log('---');
      });
    }
    
    // Get active courses (available for enrollment)
    const activeCourses = await Course.find({ status: 'active' });
    console.log(`\nActive courses (available for enrollment): ${activeCourses.length}`);
    
    if (activeCourses.length > 0) {
      activeCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course.code})`);
        console.log(`   Available spots: ${course.maxStudents - course.students.length}`);
      });
    }
    
    // Get draft courses
    const draftCourses = await Course.find({ status: 'draft' });
    console.log(`\nDraft courses: ${draftCourses.length}`);
    
    if (draftCourses.length > 0) {
      draftCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course.code})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testCourses();
