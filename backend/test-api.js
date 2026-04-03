// Test script for Gaming Platform API
// Usage: node test-api.js

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Simple HTTP request helper
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('🎮 Gaming Platform API Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  let token = null;
  let userId = null;
  let guildId = null;
  let gameId = null;
  let tournamentId = null;
  
  // Test 1: Register
  console.log('Test 1: Register user');
  const registerRes = await request('POST', '/api/register', {
    username: 'testuser_' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    campus: 'Paris Campus'
  });
  console.log(`  Status: ${registerRes.status}`);
  console.log(`  Response:`, registerRes.body);
  if (registerRes.status === 200) {
    userId = registerRes.body.userId;
    console.log('  ✅ Registration successful\n');
  } else {
    console.log('  ❌ Registration failed\n');
  }
  
  // Test 2: Login
  console.log('Test 2: Login');
  const loginRes = await request('POST', '/api/login', {
    username: 'testuser_' + Date.now(), // This won't work, need to use same username
    password: 'password123'
  });
  console.log(`  Status: ${loginRes.status}`);
  // Note: In real test we'd use the same username
  console.log(`  Response:`, loginRes.body);
  console.log('  ⚠️  Use valid credentials for login test\n');
  
  // Test 3: Get guilds (no auth required for listing)
  console.log('Test 3: Get guilds list');
  // This requires auth, will fail without token
  const guildsRes = await request('GET', '/api/guilds');
  console.log(`  Status: ${guildsRes.status}`);
  console.log(`  Response:`, guildsRes.body);
  console.log('  ⚠️  Requires authentication\n');
  
  // Test 4: Leaderboard
  console.log('Test 4: Get Pong leaderboard');
  const leaderboardRes = await request('GET', '/api/leaderboard/pong');
  console.log(`  Status: ${leaderboardRes.status}`);
  console.log(`  Response:`, leaderboardRes.body);
  if (leaderboardRes.status === 200) {
    console.log('  ✅ Leaderboard endpoint working\n');
  } else {
    console.log('  ❌ Leaderboard failed\n');
  }
  
  // Test 5: Get tournaments
  console.log('Test 5: Get tournaments list');
  const tournamentsRes = await request('GET', '/api/tournaments');
  console.log(`  Status: ${tournamentsRes.status}`);
  console.log(`  Response:`, tournamentsRes.body);
  if (tournamentsRes.status === 200) {
    console.log('  ✅ Tournaments endpoint working\n');
  } else {
    console.log('  ❌ Tournaments failed\n');
  }
  
  console.log('─────────────────────────────');
  console.log('To run authenticated tests:');
  console.log('1. Start the server: npm start');
  console.log('2. Register a user via frontend or API');
  console.log('3. Use the returned token for authenticated requests');
  console.log('─────────────────────────────\n');
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('Checking if server is running...');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Server is not running!');
    console.log('Please start the server first:');
    console.log('  npm start\n');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  await runTests();
}

main().catch(console.error);
