require('dotenv').config();
const mongoose = require('mongoose');

// Simple connection test
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected!'))
  .catch(err => console.log('Connection failed:', err));

setTimeout(() => {
  console.log('Connection state:', mongoose.connection.readyState);
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  process.exit(0);
}, 2000);
