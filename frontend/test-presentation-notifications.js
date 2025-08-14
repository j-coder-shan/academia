// Quick test for presentation creation with student notification
const testPresentationCreation = async () => {
    try {
        console.log('Testing presentation creation with student notification...');
        
        // Test data
        const testPresentation = {
            title: "Test Presentation with Notifications",
            course: "673bb2e89db4d7e2c5f8c1a2", // Replace with actual course ID
            type: "individual",
            duration: 30,
            description: "Test presentation to verify notification system",
            selectedStudents: ["673bb2e89db4d7e2c5f8c1a3"], // Replace with actual student ID
            schedule: {
                assignedDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            grading: {
                maxScore: 100,
                weightage: 20
            }
        };

        const response = await fetch('http://localhost:5000/api/presentations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPresentation)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Presentation created successfully:', result);
            console.log('Notification system test complete');
        } else {
            console.error('❌ Failed to create presentation:', result);
        }
        
    } catch (error) {
        console.error('❌ Error testing presentation creation:', error);
    }
};

// Test getting course students
const testGetCourseStudents = async (courseId) => {
    try {
        console.log('Testing course students endpoint...');
        
        const response = await fetch(`http://localhost:5000/api/presentations/course/${courseId}/students`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Course students fetched successfully:', result);
        } else {
            console.error('❌ Failed to fetch course students:', result);
        }
        
    } catch (error) {
        console.error('❌ Error fetching course students:', error);
    }
};

console.log('Presentation notification test script loaded. Use:');
console.log('- testPresentationCreation() to test presentation creation');
console.log('- testGetCourseStudents("courseId") to test getting course students');
