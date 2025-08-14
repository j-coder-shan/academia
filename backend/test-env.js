require('dotenv').config();

console.log('Environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
console.log('PORT:', process.env.PORT);

if (process.env.MONGO_URI) {
  console.log('MONGO_URI length:', process.env.MONGO_URI.length);
  console.log('MONGO_URI starts with:', process.env.MONGO_URI.substring(0, 20) + '...');
}
