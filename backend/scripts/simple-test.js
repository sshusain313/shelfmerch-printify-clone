console.log('Script started');
require('dotenv').config();
console.log('Dotenv loaded');
console.log('MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('MONGO_URL value:', process.env.MONGO_URL ? 'SET' : 'NOT SET');




