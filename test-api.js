import fetch from 'node-fetch';

// Authenticate and test API
async function testAPI() {
  // 1. Login and get token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const loginData = await loginRes.json();
  console.log('Login response:', loginData);

  if (!loginRes.ok) {
    console.error('Failed to login');
    return;
  }

  // Extract cookies for session
  const cookies = loginRes.headers.get('set-cookie');
  
  // 2. Test the new daily content route
  const contentRes = await fetch('http://localhost:5000/api/daily-contents/course/1/week/1/day/1', {
    headers: {
      'Cookie': cookies
    }
  });

  const contentData = await contentRes.json();
  console.log('Daily content response:', contentData);

  // 3. Test daily content by content ID route
  const dailyContentRes = await fetch('http://localhost:5000/api/daily-contents/content/1', {
    headers: {
      'Cookie': cookies
    }
  });

  const dailyContentData = await dailyContentRes.json();
  console.log('Daily content by content ID response:', dailyContentData);
}

testAPI().catch(console.error);