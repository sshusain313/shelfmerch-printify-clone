// Script to generate secure JWT secrets
const crypto = require('crypto');

console.log('\n=== Generating Secure JWT Secrets ===\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('Add these to your .env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('\n');


