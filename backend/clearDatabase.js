const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Clear all users
        const result = await db.collection('users').deleteMany({});
        console.log(`Deleted ${result.deletedCount} users`);
        
        // Drop all indexes except _id
        const indexes = await db.collection('users').indexes();
        for (const index of indexes) {
            if (index.name !== '_id_') {
                try {
                    await db.collection('users').dropIndex(index.name);
                    console.log(`Dropped index: ${index.name}`);
                } catch (error) {
                    console.log(`Could not drop index ${index.name}: ${error.message}`);
                }
            }
        }
        
        await mongoose.disconnect();
        console.log('Database cleared successfully!');
    } catch (error) {
        console.error('Clear database error:', error.message);
    }
}

clearDatabase();
