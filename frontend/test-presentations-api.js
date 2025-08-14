// Simple test to check presentations API
async function testPresentationsAPI() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('❌ No auth token found');
        return;
    }

    console.log('🧪 Testing presentations API...');
    
    try {
        const response = await fetch('http://localhost:5000/api/presentations/student', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', data);
            console.log(`📊 Found ${data.presentations?.length || 0} presentations`);
            
            if (data.presentations && data.presentations.length > 0) {
                console.log('📋 Presentation details:');
                data.presentations.forEach((p, index) => {
                    console.log(`  ${index + 1}. "${p.title}" - Course: ${p.course?.name} - Status: ${p.status}`);
                });
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
    }
}

// Run the test
testPresentationsAPI();
