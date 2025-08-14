const mongoose = require('mongoose');
const Presentation = require('./models/presentationModel');
const Course = require('./models/courseModel');
const User = require('./models/userModel');

async function testPresentationsBackend() {
    try {
        // Load environment variables
        require('dotenv').config();
        
        // Connect to MongoDB Atlas using the same connection as the main app
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🧪 Testing presentations backend...\n');

        // 1. Check all presentations in database
        const allPresentations = await Presentation.find({})
            .populate('course', 'name code')
            .populate('lecturer', 'name email');
        
        console.log(`📊 Total presentations in database: ${allPresentations.length}`);
        allPresentations.forEach((p, index) => {
            console.log(`  ${index + 1}. "${p.title}" - Course: ${p.course?.name} - Status: ${p.status} - Created: ${p.createdAt}`);
        });

        // 2. Check published/active presentations
        const activePresentations = await Presentation.find({
            status: { $in: ['published', 'active'] }
        })
        .populate('course', 'name code')
        .populate('lecturer', 'name email');
        
        console.log(`\n📋 Published/Active presentations: ${activePresentations.length}`);
        activePresentations.forEach((p, index) => {
            console.log(`  ${index + 1}. "${p.title}" - Course: ${p.course?.name} - Status: ${p.status}`);
        });

        // 3. Check students
        const students = await User.find({ role: 'student' });
        console.log(`\n👥 Students in database: ${students.length}`);
        students.forEach((s, index) => {
            console.log(`  ${index + 1}. ${s.name} (${s.email})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Test error:', error);
        process.exit(1);
    }
}

testPresentationsBackend();
