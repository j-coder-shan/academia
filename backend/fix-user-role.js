const mongoose = require('mongoose');
const User = require('./models/userModel');

async function checkAndFixUserRole() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hashanprabboth:joJsyByBQJD6MroR@cluster0.fx1he1t.mongodb.net/academia_lms?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔍 Checking user roles...\n');

        // Find all users
        const users = await User.find({}).select('name email role isActive');
        
        console.log(`📊 Found ${users.length} users:`);
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
        });

        // Check if there are any lecturers
        const lecturers = users.filter(u => u.role === 'lecturer');
        console.log(`\n👨‍🏫 Found ${lecturers.length} lecturers`);

        if (lecturers.length === 0) {
            console.log('\n⚠️  No lecturers found! Need to create one or update a user to lecturer role.');
            
            // Find the user named 'shan' or similar and update to lecturer
            const userToUpdate = users.find(u => u.name.toLowerCase().includes('shan') || u.email.includes('shan'));
            
            if (userToUpdate) {
                console.log(`\n🔧 Updating ${userToUpdate.name} to lecturer role...`);
                userToUpdate.role = 'lecturer';
                await userToUpdate.save();
                console.log(`✅ ${userToUpdate.name} is now a lecturer!`);
            } else {
                console.log('\n💡 Please manually update a user role to "lecturer" in the database');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAndFixUserRole();
