const mongoose = require('mongoose');
const User = require('./models/userModel');
const Course = require('./models/courseModel');
const Presentation = require('./models/presentationModel');
const Notification = require('./models/notificationModel');

async function testNotificationSystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/academia_lms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔍 Testing Notification System...\n');

        // 1. Check if notifications exist
        const notifications = await Notification.find({})
            .populate('recipient', 'name email role')
            .populate('sender', 'name email')
            .sort({ createdAt: -1 });

        console.log(`📬 Found ${notifications.length} total notifications:`);
        notifications.forEach(notification => {
            console.log(`  - To: ${notification.recipient?.name} (${notification.recipient?.role})`);
            console.log(`    From: ${notification.sender?.name || 'System'}`);
            console.log(`    Title: ${notification.title}`);
            console.log(`    Type: ${notification.type}`);
            console.log(`    Read: ${notification.isRead ? 'Yes' : 'No'}`);
            console.log(`    Created: ${notification.createdAt}`);
            console.log('');
        });

        // 2. Check students and their enrollment
        const students = await User.find({ role: 'student' });
        console.log(`\n👥 Found ${students.length} students:`);
        
        for (const student of students) {
            console.log(`\n👤 Student: ${student.name} (${student.email})`);
            
            // Find courses this student is enrolled in
            const enrolledCourses = await Course.find({ students: student._id }).select('name code');
            console.log(`  📚 Enrolled in ${enrolledCourses.length} courses:`);
            enrolledCourses.forEach(course => {
                console.log(`    - ${course.name} (${course.code})`);
            });
            
            // Find notifications for this student
            const studentNotifications = await Notification.find({ recipient: student._id })
                .populate('sender', 'name')
                .sort({ createdAt: -1 });
            console.log(`  📬 Has ${studentNotifications.length} notifications:`);
            studentNotifications.forEach(notif => {
                console.log(`    - "${notif.title}" (${notif.type}) - Read: ${notif.isRead ? 'Yes' : 'No'}`);
            });
        }

        // 3. Check presentations and their notifications
        const presentations = await Presentation.find({})
            .populate('course', 'name code students')
            .populate('lecturer', 'name');
        
        console.log(`\n📋 Found ${presentations.length} presentations:`);
        presentations.forEach(presentation => {
            console.log(`\n📝 Presentation: "${presentation.title}"`);
            console.log(`    Course: ${presentation.course?.name} (${presentation.course?.code})`);
            console.log(`    Lecturer: ${presentation.lecturer?.name}`);
            console.log(`    Status: ${presentation.status}`);
            console.log(`    Course has ${presentation.course?.students?.length || 0} enrolled students`);
            console.log(`    Notifications sent: ${presentation.notifications?.length || 0} times`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Test error:', error);
        process.exit(1);
    }
}

testNotificationSystem();
