const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const User = require('./models/userModel');
const Presentation = require('./models/presentationModel');
require('dotenv').config();

// Clean up mock/test data and prepare for production use
const cleanupMockData = async () => {
  try {
    console.log('=== Academia LMS Mock Data Cleanup ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Remove any test/mock users
    const testUsers = await User.find({
      $or: [
        { email: /test\.com$/ },
        { email: /example\.com$/ },
        { name: /test/i },
        { name: /mock/i },
        { email: 'lecturer@test.com' },
        { email: 'student@test.com' }
      ]
    });
    
    if (testUsers.length > 0) {
      console.log(`🗑️  Found ${testUsers.length} test/mock users to remove:`);
      testUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
      
      // Remove test users
      await User.deleteMany({
        $or: [
          { email: /test\.com$/ },
          { email: /example\.com$/ },
          { name: /test/i },
          { name: /mock/i },
          { email: 'lecturer@test.com' },
          { email: 'student@test.com' }
        ]
      });
      console.log(`✓ Removed ${testUsers.length} test/mock users\n`);
    } else {
      console.log('✓ No test/mock users found\n');
    }
    
    // Remove any test/mock courses
    const testCourses = await Course.find({
      $or: [
        { code: /TEST/i },
        { code: /MOCK/i },
        { title: /test/i },
        { title: /mock/i },
        { code: 'TEST101' }
      ]
    });
    
    if (testCourses.length > 0) {
      console.log(`🗑️  Found ${testCourses.length} test/mock courses to remove:`);
      testCourses.forEach(course => {
        console.log(`   - ${course.title} (${course.code})`);
      });
      
      // Remove test courses
      await Course.deleteMany({
        $or: [
          { code: /TEST/i },
          { code: /MOCK/i },
          { title: /test/i },
          { title: /mock/i },
          { code: 'TEST101' }
        ]
      });
      console.log(`✓ Removed ${testCourses.length} test/mock courses\n`);
    } else {
      console.log('✓ No test/mock courses found\n');
    }
    
    // Remove any test/mock presentations
    const testPresentations = await Presentation.find({
      $or: [
        { title: /test/i },
        { title: /mock/i },
        { description: /test/i }
      ]
    });
    
    if (testPresentations.length > 0) {
      console.log(`🗑️  Found ${testPresentations.length} test/mock presentations to remove:`);
      testPresentations.forEach(presentation => {
        console.log(`   - ${presentation.title}`);
      });
      
      // Remove test presentations
      await Presentation.deleteMany({
        $or: [
          { title: /test/i },
          { title: /mock/i },
          { description: /test/i }
        ]
      });
      console.log(`✓ Removed ${testPresentations.length} test/mock presentations\n`);
    } else {
      console.log('✓ No test/mock presentations found\n');
    }
    
    // Verify cleanup - show remaining real data
    const realUsers = await User.find({});
    const realCourses = await Course.find({});
    const realPresentations = await Presentation.find({});
    
    console.log('=== REMAINING DATA (ALL REAL) ===');
    console.log(`👥 Real Users: ${realUsers.length}`);
    console.log(`📚 Real Courses: ${realCourses.length}`);
    console.log(`🎤 Real Presentations: ${realPresentations.length}`);
    
    console.log('\n✅ Mock data cleanup completed!');
    console.log('📝 The database now contains only real user-created data');
    console.log('🌐 Users can register at: http://localhost:5000/html/login.html');
    console.log('📊 Lecturers can create courses from their dashboard');
    console.log('🎓 Students can browse and enroll in courses');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
};

cleanupMockData();
