const mongoose = require('mongoose');
require('dotenv').config();

// Use MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI;

// Notification model
const Notification = require('./models/notificationModel');

async function checkNotifications() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    const notifications = await Notification.find()
      .populate('recipient', 'name email role')
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`\nFound ${notifications.length} notifications:`);
    
    if (notifications.length === 0) {
      console.log('❌ No notifications found in the database!');
      console.log('This explains why students don\'t see notifications.');
    } else {
      notifications.forEach((notification, index) => {
        console.log(`\n${index + 1}. Notification:`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Recipient: ${notification.recipient?.name} (${notification.recipient?.role})`);
        console.log(`   Sender: ${notification.sender?.name} (${notification.sender?.role})`);
        console.log(`   Status: ${notification.status}`);
        console.log(`   Created: ${notification.createdAt}`);
        console.log(`   Priority: ${notification.priority}`);
      });
    }

  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkNotifications();
