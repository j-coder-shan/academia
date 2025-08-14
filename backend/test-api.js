const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

// Test student credentials
const testStudent = {
  name: 'Test Student',
  email: 'student@test.com',
  password: 'password123',
  role: 'student'
};

async function testStudentFlow() {
  try {
    console.log('🧪 Starting student course browsing test...\n');
    
    // Step 1: Try to register a test student (might fail if already exists)
    console.log('📝 Step 1: Registering test student...');
    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, testStudent);
      console.log('✅ Student registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Student already exists, proceeding to login...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
        throw error;
      }
    }
    
    // Step 2: Login to get authentication token
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: testStudent.email,
      password: testStudent.password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Set up headers for authenticated requests
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 3: Test student courses endpoint (enrolled courses)
    console.log('\n📚 Step 3: Getting enrolled courses...');
    try {
      const enrolledResponse = await axios.get(`${baseURL}/student/courses`, {
        headers: authHeaders
      });
      console.log(`✅ Enrolled courses retrieved: ${enrolledResponse.data.length} courses`);
      if (enrolledResponse.data.length > 0) {
        enrolledResponse.data.forEach((course, index) => {
          console.log(`   ${index + 1}. ${course.title} (${course.code})`);
        });
      } else {
        console.log('   ℹ️ No enrolled courses found');
      }
    } catch (error) {
      console.log('❌ Failed to get enrolled courses:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Test available courses endpoint (the main issue)
    console.log('\n🔍 Step 4: Getting available courses...');
    try {
      const availableResponse = await axios.get(`${baseURL}/student/available-courses`, {
        headers: authHeaders
      });
      console.log(`✅ Available courses retrieved: ${availableResponse.data.length} courses`);
      
      if (availableResponse.data.length > 0) {
        console.log('\n📋 Available courses:');
        availableResponse.data.forEach((course, index) => {
          console.log(`   ${index + 1}. ${course.title} (${course.code})`);
          console.log(`      Status: ${course.status || 'Unknown'}`);
          console.log(`      Instructor: ${course.lecturer?.name || 'Unknown'}`);
          console.log(`      Enrolled: ${course.enrolledCount}/${course.maxStudents}`);
          console.log(`      Available spots: ${course.availableSpots}`);
          console.log('      ---');
        });
      } else {
        console.log('   ⚠️ No available courses found!');
        console.log('   This is the issue - students cannot see any courses to enroll in.');
      }
    } catch (error) {
      console.log('❌ Failed to get available courses:', error.response?.data?.message || error.message);
      if (error.response?.status === 401) {
        console.log('   This might be an authentication issue.');
      }
    }
    
    // Step 5: Check if there are any courses in the system at all
    console.log('\n🔍 Step 5: Checking lecturer courses to verify courses exist...');
    try {
      // First register/login as lecturer to check if courses exist
      const testLecturer = {
        name: 'Test Lecturer',
        email: 'lecturer@test.com',
        password: 'password123',
        role: 'lecturer'
      };
      
      // Try to register lecturer
      try {
        await axios.post(`${baseURL}/auth/register`, testLecturer);
        console.log('✅ Lecturer registered');
      } catch (error) {
        console.log('ℹ️ Lecturer already exists or registration failed');
      }
      
      // Login as lecturer
      const lecturerLoginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: testLecturer.email,
        password: testLecturer.password
      });
      
      const lecturerToken = lecturerLoginResponse.data.token;
      const lecturerHeaders = {
        'Authorization': `Bearer ${lecturerToken}`,
        'Content-Type': 'application/json'
      };
      
      // Get lecturer courses
      const lecturerCoursesResponse = await axios.get(`${baseURL}/lecturer/courses`, {
        headers: lecturerHeaders
      });
      
      console.log(`✅ Total courses in system: ${lecturerCoursesResponse.data.length}`);
      if (lecturerCoursesResponse.data.length > 0) {
        console.log('\n📋 All courses in system:');
        lecturerCoursesResponse.data.forEach((course, index) => {
          console.log(`   ${index + 1}. ${course.title} (${course.code})`);
          console.log(`      Status: ${course.status}`);
          console.log(`      Students: ${course.students?.length || 0}/${course.maxStudents || 'Unknown'}`);
          console.log('      ---');
        });
      }
      
    } catch (error) {
      console.log('❌ Failed to check lecturer courses:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎯 Test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3001');
    }
  }
}

// Check if axios is available
console.log('Starting API test...');
testStudentFlow();
