const mongoose = require('mongoose');
require('dotenv').config();

// Use MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI;

// Course model
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Course = mongoose.model('Course', courseSchema);

async function listCourses() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    const courses = await Course.find().populate('lecturer', 'name email').populate('students', 'name email');
    
    console.log(`\nFound ${courses.length} courses:`);
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. Course: ${course.name}`);
      console.log(`   Code: ${course.code}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Description: ${course.description || 'No description'}`);
      console.log(`   Lecturer: ${course.lecturer ? `${course.lecturer.name} (${course.lecturer.email})` : 'No lecturer'}`);
      console.log(`   Students: ${course.students.length}`);
      if (course.students.length > 0) {
        course.students.forEach(student => {
          console.log(`     - ${student.name} (${student.email})`);
        });
      }
      console.log(`   Created: ${course.createdAt}`);
    });

    if (courses.length === 0) {
      console.log('\nNo courses found in the database. You may need to create some courses first.');
    }

  } catch (error) {
    console.error('Error listing courses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listCourses();
