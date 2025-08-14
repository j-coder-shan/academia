// Test script to set up fake authentication
localStorage.setItem('authToken', 'test-token-123');
localStorage.setItem('userRole', 'lecturer');
localStorage.setItem('userId', 'test-lecturer-id');

console.log('Test authentication set up:');
console.log('Token:', localStorage.getItem('authToken'));
console.log('Role:', localStorage.getItem('userRole'));
console.log('User ID:', localStorage.getItem('userId'));

// Now reload the page
location.reload();
