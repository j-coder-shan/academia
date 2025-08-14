// Temporary mock data for testing without MongoDB
const mockPresentations = [
    {
        _id: '1',
        title: 'Introduction to AI',
        description: 'Learn the basics of artificial intelligence',
        course: {
            _id: 'course1',
            name: 'Computer Science 101',
            code: 'CS101'
        },
        lecturer: {
            _id: 'lecturer1',
            name: 'Dr. Smith',
            email: 'smith@university.edu'
        },
        status: 'published',
        duration: 30,
        schedule: {
            dueDate: new Date('2025-07-15'),
            assignedDate: new Date('2025-07-01')
        },
        submissionStatus: 'not_submitted'
    },
    {
        _id: '2',
        title: 'Data Structures Overview',
        description: 'Understanding basic data structures',
        course: {
            _id: 'course2',
            name: 'Data Structures',
            code: 'DS201'
        },
        lecturer: {
            _id: 'lecturer2',
            name: 'Prof. Johnson',
            email: 'johnson@university.edu'
        },
        status: 'published',
        duration: 45,
        schedule: {
            dueDate: new Date('2025-07-20'),
            assignedDate: new Date('2025-07-05')
        },
        submissionStatus: 'not_submitted'
    }
];

// Test function to check if presentations render correctly
function testPresentationRendering() {
    console.log('🧪 Testing presentation rendering with mock data...');
    
    if (window.studentPresentations) {
        window.studentPresentations.presentations = mockPresentations;
        window.studentPresentations.renderPresentations();
        window.studentPresentations.updateStatistics();
        console.log('✅ Mock data loaded and rendered');
    } else {
        console.log('❌ StudentPresentations not found');
    }
}

// Auto-run test
setTimeout(testPresentationRendering, 2000);
