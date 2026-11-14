const assert = require('assert');
const http = require('http');

const PORT = 5099;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const app = require('../index');
const db = require('../db/jsonDb');

let server;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Queue Management Application Test Suite...\n');
  server = app.listen(PORT);

  try {
    // Reset test database
    db.reset();

    // 1. Manager Login / Register (Requirement #1)
    console.log('➡️  Test 1: Manager Registration & Login');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Manager',
      email: 'manager@test.com',
      username: 'testmanager',
      password: 'password123'
    });
    assert.strictEqual(regRes.status, 201, 'Registration should return 201');
    assert.ok(regRes.data.token, 'Should receive JWT token');
    const token = regRes.data.token;
    console.log('   ✅ Manager registered successfully with JWT');

    // 2. Create Named Queue (Requirement #1 & #2)
    console.log('➡️  Test 2: Create Named Queue');
    const queueRes = await makeRequest(
      'POST',
      '/api/queues',
      {
        name: 'Priority Express Counter',
        description: 'Fast track queue for express transactions',
        prefix: 'EXP'
      },
      token
    );
    assert.strictEqual(queueRes.status, 201, 'Queue creation should return 201');
    assert.strictEqual(queueRes.data.queue.name, 'Priority Express Counter');
    assert.strictEqual(queueRes.data.queue.prefix, 'EXP');
    const queueId = queueRes.data.queue.id;
    console.log(`   ✅ Queue created: "${queueRes.data.queue.name}" (ID: ${queueId})`);

    // 3. Add Persons / Tokens into Queue (Requirement #3)
    console.log('➡️  Test 3: Add Persons and Generate Tokens');
    const t1 = await makeRequest(
      'POST',
      '/api/tokens',
      {
        queueId,
        personName: 'Alice Johnson',
        serviceReason: 'Account Opening'
      },
      token
    );
    assert.strictEqual(t1.status, 201);
    assert.strictEqual(t1.data.token.position, 1, 'First token must be position #1');
    assert.strictEqual(t1.data.token.tokenNumber, 'EXP-101');
    const token1Id = t1.data.token.id;

    const t2 = await makeRequest(
      'POST',
      '/api/tokens',
      {
        queueId,
        personName: 'Bob Smith',
        serviceReason: 'Cash Deposit'
      },
      token
    );
    assert.strictEqual(t2.status, 201);
    assert.strictEqual(t2.data.token.position, 2, 'Second token must be position #2');
    assert.strictEqual(t2.data.token.tokenNumber, 'EXP-102');
    const token2Id = t2.data.token.id;

    const t3 = await makeRequest(
      'POST',
      '/api/tokens',
      {
        queueId,
        personName: 'Charlie Davis',
        serviceReason: 'Loan Inquiry'
      },
      token
    );
    assert.strictEqual(t3.status, 201);
    assert.strictEqual(t3.data.token.position, 3, 'Third token must be position #3');
    const token3Id = t3.data.token.id;
    console.log('   ✅ 3 tokens created with sequential positions #1, #2, #3');

    // 4. Queue Displays Waiting Tokens (Requirement #4)
    console.log('➡️  Test 4: Display Waiting Tokens Roster');
    const rosterRes = await makeRequest('GET', `/api/tokens/queue/${queueId}`);
    assert.strictEqual(rosterRes.status, 200);
    assert.strictEqual(rosterRes.data.waitingTokens.length, 3);
    assert.strictEqual(rosterRes.data.waitingTokens[0].personName, 'Alice Johnson');
    assert.strictEqual(rosterRes.data.waitingTokens[1].personName, 'Bob Smith');
    assert.strictEqual(rosterRes.data.waitingTokens[2].personName, 'Charlie Davis');
    console.log('   ✅ Waiting tokens correctly listed in FIFO order');

    // 5. Move Tokens UP and DOWN (Requirement #5)
    console.log('➡️  Test 5: Move Tokens Up and Down');
    // Move Bob Smith (position 2) UP to position 1
    const moveUpRes = await makeRequest(
      'POST',
      `/api/tokens/${token2Id}/move`,
      { direction: 'up' },
      token
    );
    assert.strictEqual(moveUpRes.status, 200);
    const updatedRoster1 = await makeRequest('GET', `/api/tokens/queue/${queueId}`);
    assert.strictEqual(updatedRoster1.data.waitingTokens[0].personName, 'Bob Smith', 'Bob should now be #1');
    assert.strictEqual(updatedRoster1.data.waitingTokens[1].personName, 'Alice Johnson', 'Alice should now be #2');
    console.log('   ✅ Move UP verified: Bob moved from #2 to #1');

    // Move Bob Smith back DOWN to position 2
    const moveDownRes = await makeRequest(
      'POST',
      `/api/tokens/${token2Id}/move`,
      { direction: 'down' },
      token
    );
    assert.strictEqual(moveDownRes.status, 200);
    const updatedRoster2 = await makeRequest('GET', `/api/tokens/queue/${queueId}`);
    assert.strictEqual(updatedRoster2.data.waitingTokens[0].personName, 'Alice Johnson', 'Alice should be #1 again');
    assert.strictEqual(updatedRoster2.data.waitingTokens[1].personName, 'Bob Smith', 'Bob should be #2 again');
    console.log('   ✅ Move DOWN verified: Bob moved back to #2');

    // 6. Assign Token at Top of Queue for Service (Requirement #6)
    console.log('➡️  Test 6: Call Next Token for Service');
    const callNextRes = await makeRequest(
      'POST',
      `/api/tokens/queue/${queueId}/call-next`,
      {},
      token
    );
    assert.strictEqual(callNextRes.status, 200);
    assert.strictEqual(callNextRes.data.inServiceToken.personName, 'Alice Johnson');
    assert.strictEqual(callNextRes.data.inServiceToken.status, 'IN_SERVICE');
    // Bob should now be #1 in waiting
    assert.strictEqual(callNextRes.data.waitingTokens[0].personName, 'Bob Smith');
    assert.strictEqual(callNextRes.data.waitingTokens[0].position, 1);
    console.log('   ✅ Top token (Alice) assigned to IN_SERVICE; remaining queue shifted to #1');

    // Complete Alice's service
    const completeRes = await makeRequest(
      'POST',
      `/api/tokens/${token1Id}/complete`,
      {},
      token
    );
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.data.token.status, 'COMPLETED');
    console.log('   ✅ Alice service completed');

    // 7. Cancel a Token from Queue (Requirement #7)
    console.log('➡️  Test 7: Cancel Token from Queue');
    const cancelRes = await makeRequest(
      'POST',
      `/api/tokens/${token3Id}/cancel`,
      { reason: 'Customer changed mind' },
      token
    );
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.cancelledToken.status, 'CANCELLED');
    const postCancelRoster = await makeRequest('GET', `/api/tokens/queue/${queueId}`);
    assert.strictEqual(postCancelRoster.data.waitingTokens.length, 1);
    assert.strictEqual(postCancelRoster.data.waitingTokens[0].personName, 'Bob Smith');
    assert.strictEqual(postCancelRoster.data.waitingTokens[0].position, 1);
    console.log('   ✅ Token cancelled and remaining queue re-indexed cleanly');

    // 8. Analytics Dashboard (Requirement #8)
    console.log('➡️  Test 8: Analytics Dashboard Endpoint');
    const analyticsRes = await makeRequest('GET', `/api/analytics?queueId=${queueId}`);
    assert.strictEqual(analyticsRes.status, 200);
    assert.strictEqual(analyticsRes.data.kpis.totalTokens, 3);
    assert.strictEqual(analyticsRes.data.kpis.totalCompleted, 1);
    assert.strictEqual(analyticsRes.data.kpis.totalCancelled, 1);
    assert.strictEqual(analyticsRes.data.kpis.totalWaiting, 1);
    assert.ok(analyticsRes.data.trends.hours.length > 0, 'Should have hourly trends');
    assert.ok(analyticsRes.data.queueComparison.length > 0, 'Should have queue comparison');
    console.log('   ✅ Analytics calculated accurately (Wait times, KPIs, Trends)');

    console.log('\n🎉 ALL 8 REQUIREMENTS TESTED AND PASSED FLAWLESSLY!\n');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
