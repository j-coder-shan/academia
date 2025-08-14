const mongoose = require('mongoose');
require('dotenv').config();

async function migrateUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Get all users
        const users = await usersCollection.find({}).toArray();
        console.log(`Found ${users.length} users to migrate`);
        
        for (const user of users) {
            const updateData = {};
            
            // Migrate username to academicInfo
            if (user.username) {
                if (user.role === 'student') {
                    updateData['academicInfo.studentId'] = user.username;
                } else if (user.role === 'lecturer') {
                    updateData['academicInfo.employeeId'] = user.username;
                }
            }
            
            // Add default name if missing
            if (!user.name) {
                updateData.name = user.role === 'student' ? 
                    `Student ${user.username}` : 
                    `Lecturer ${user.username}`;
            }
            
            // Remove username field
            updateData.$unset = { username: "" };
            
            // Update the user
            await usersCollection.updateOne(
                { _id: user._id },
                { 
                    $set: updateData,
                    $unset: { username: "" }
                }
            );
            
            console.log(`Migrated user: ${user.email} (${user.username} -> ${user.role})`);
        }
        
        console.log('\n=== Migration completed! ===');
        
        // Drop the old username index
        try {
            await usersCollection.dropIndex('username_1');
            await usersCollection.dropIndex('username_1_isActive_1');
            console.log('Dropped old username indexes');
        } catch (error) {
            console.log('No username indexes to drop or already removed');
        }
        
        await mongoose.disconnect();
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error.message);
    }
}

migrateUsers();
