const mongoose = require('mongoose');
const User = require('./models/userModel');

async function fixCurrentUserRole() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hashanprabboth:joJsyByBQJD6MroR@cluster0.fx1he1t.mongodb.net/academia_lms?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔍 Checking users in database...\n');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} - Email: ${user.email} - Role: ${user.role} - Active: ${user.isActive}`);
        });

        // Find user with name 'shanx' or similar
        const userToFix = users.find(u => 
            u.name.toLowerCase().includes('shan') || 
            u.email.toLowerCase().includes('shan')
        );

        if (userToFix) {
            console.log(`\n🔧 Found user to update: ${userToFix.name} (${userToFix.email})`);
            console.log(`   Current role: ${userToFix.role}`);
            
            if (userToFix.role !== 'lecturer') {
                userToFix.role = 'lecturer';
                await userToFix.save();
                console.log(`✅ Updated ${userToFix.name} to lecturer role!`);
            } else {
                console.log(`✅ ${userToFix.name} already has lecturer role`);
            }
        } else {
            console.log('\n❌ No user found with "shan" in name or email');
            
            // Update the first user to lecturer if no specific user found
            if (users.length > 0) {
                const firstUser = users[0];
                console.log(`🔧 Updating first user ${firstUser.name} to lecturer role...`);
                firstUser.role = 'lecturer';
                await firstUser.save();
                console.log(`✅ Updated ${firstUser.name} to lecturer role!`);
            }
        }

        console.log('\n📋 Final user roles:');
        const updatedUsers = await User.find({});
        updatedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} - Role: ${user.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixCurrentUserRole();
