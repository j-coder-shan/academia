const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

async function createDemoUsers() {
  try {
    // Check if demo users already exist
    const existingStudent = await User.findOne({ email: 'student@demo.com' });
    const existingLecturer = await User.findOne({ email: 'lecturer@demo.com' });

    if (existingStudent && existingLecturer) {
      console.log('Demo users already exist!');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // Create demo student
    if (!existingStudent) {
      const demoStudent = new User({
        name: 'Demo Student',
        email: 'student@demo.com',
        password: hashedPassword,
        role: 'student',
        profile: {
          bio: 'Demo student account for testing purposes',
        },
        academicInfo: {
          department: 'Computer Science',
          yearOfStudy: 2,
          specialization: 'Software Engineering'
        }
      });

      await demoStudent.save();
      console.log('✅ Demo student created: student@demo.com / demo123');
    }

    // Create demo lecturer
    if (!existingLecturer) {
      const demoLecturer = new User({
        name: 'Demo Lecturer',
        email: 'lecturer@demo.com',
        password: hashedPassword,
        role: 'lecturer',
        profile: {
          bio: 'Demo lecturer account for testing purposes',
        },
        academicInfo: {
          department: 'Computer Science',
          specialization: 'Software Engineering'
        }
      });

      await demoLecturer.save();
      console.log('✅ Demo lecturer created: lecturer@demo.com / demo123');
    }

    console.log('🎉 Demo users setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
    process.exit(1);
  }
}

createDemoUsers();
