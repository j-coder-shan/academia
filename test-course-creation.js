const fetch = require('node-fetch');

// Test data that matches what the frontend would send
const testCourseData = {
    title: "Test Course",
    description: "This is a test course description",
    code: "TEST101",
    category: "Computer Science",
    level: "Beginner",
    credits: "3",  // Send as string
    startDate: "2024-01-15",  // Send as string  
    endDate: "2024-05-15",    // Send as string
    maxStudents: "30",
    schedule: [
        {
            day: "Monday",
            startTime: "09:00",
            endTime: "11:00",
            room: "CS101",
            type: "lecture"
        }
    ]
};

async function testCourseCreation() {
    try {
        console.log('Testing course creation with data:', testCourseData);
        
        const response = await fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: In real app, we'd need a valid JWT token here
                'Authorization': 'Bearer your-jwt-token-here'
            },
            body: JSON.stringify(testCourseData)
        });

        const result = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testCourseCreation();
