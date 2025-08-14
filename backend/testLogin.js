const mongoose = require('mongoose');
require('dotenv').config();

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Check the actual user data
        const user = await db.collection('users').findOne({ role: 'student' });
        console.log('Found user:', {
            email: user.email,
            role: user.role,
            studentId: user.academicInfo?.studentId,
            hasPassword: !!user.password
        });
        
        // Test login with this user
        const bcrypt = require('bcryptjs');
        const passwordMatch = await bcrypt.compare('password123', user.password);
        console.log('Password match:', passwordMatch);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
