import axios from 'axios';

async function testRateLimit() {
  const url = 'http://localhost:3001/auth/login';
  console.log(`Testing rate limit on ${url}...`);
  
  for (let i = 0; i < 15; i++) {
    try {
      const response = await axios.post(url, {
        email: 'test@example.com',
        password: 'password',
      });
      console.log(`Request ${i + 1}: ${response.status}`);
    } catch (error: any) {
      console.log(`Request ${i + 1}: ${error.response?.status} - ${error.response?.data?.message}`);
      if (error.response?.status === 429) {
        console.log('SUCCESS: Rate limit triggered!');
        return;
      }
    }
  }
  console.log('FAILURE: Rate limit NOT triggered after 15 requests.');
}

testRateLimit();
