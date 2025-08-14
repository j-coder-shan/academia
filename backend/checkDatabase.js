const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Check existing users
        const users = await db.collection('users').find({}).limit(5).toArray();
        console.log('\n=== Existing Users (first 5) ===');
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`, {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.academicInfo?.studentId || user.studentId,
                employeeId: user.academicInfo?.employeeId || user.employeeId,
                username: user.username,
                academicInfo: user.academicInfo
            });
        });
        
        // Check total count
        const count = await db.collection('users').countDocuments();
        console.log(`\nTotal users: ${count}`);
        
        // Check indexes
        const indexes = await db.collection('users').indexes();
        console.log('\n=== Current Indexes ===');
        indexes.forEach(index => {
            console.log('Index:', index.name, 'Keys:', index.key);
        });
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkDatabase();
