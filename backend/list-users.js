const mongoose = require('mongoose');
const User = require('./models/userModel');

async function listAllUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hashanprabboth:joJsyByBQJD6MroR@cluster0.fx1he1t.mongodb.net/academia_lms?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('👥 All users in the database:\n');
        
        const users = await User.find({}).select('name email role academicInfo.studentId academicInfo.employeeId isActive createdAt');
        
        console.log(`📊 Total users: ${users.length}\n`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Student ID: ${user.academicInfo?.studentId || 'N/A'}`);
            console.log(`   Employee ID: ${user.academicInfo?.employeeId || 'N/A'}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('   ---');
        });

        // Show summary by role
        const roleCount = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📈 Users by role:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`   ${role}: ${count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllUsers();
