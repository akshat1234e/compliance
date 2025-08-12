// Performance and Load Tests for RBI Compliance Platform
// Testing system performance under various load conditions

const autocannon = require('autocannon');
const { performance } = require('perf_hooks');
const request = require('supertest');
const { app } = require('../../src/app');
const { DatabaseService } = require('../../src/services/database/database.service');

describe('Performance Tests', () => {
  let databaseService;
  let testUser;
  let accessToken;
  let baseUrl;

  beforeAll(async () => {
    // Initialize database
    databaseService = new DatabaseService();
    await databaseService.connect();

    // Start test server
    const server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create test user and get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'perf.test@example.com',
        password: 'SecurePassword123!',
        name: 'Performance Test User',
        role: 'user'
      });

    testUser = registerResponse.body.data.user;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'perf.test@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.data.accessToken;

    // Create test data for performance tests
    await createTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await databaseService.disconnect();
  });

  async function createTestData() {
    // Create multiple compliance tasks for testing
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      const task = await request(app)
        .post('/api/compliance/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Performance Test Task ${i}`,
          category: 'REGULATORY_REPORTING',
          description: `Test task ${i} for performance testing`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: i % 3 === 0 ? 'HIGH' : i % 3 === 1 ? 'MEDIUM' : 'LOW',
          assignedTo: testUser.id
        });
      tasks.push(task.body.data.task);
    }

    // Create test customers
    for (let i = 0; i < 50; i++) {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Test Customer ${i}`,
          email: `customer${i}@example.com`,
          phone: `+91-98765432${i.toString().padStart(2, '0')}`,
          address: `Test Address ${i}, Mumbai, India`
        });
    }

    // Create test transactions
    for (let i = 0; i < 200; i++) {
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: `CUST${(i % 50).toString().padStart(3, '0')}`,
          amount: Math.floor(Math.random() * 100000) + 1000,
          currency: 'INR',
          type: i % 2 === 0 ? 'CREDIT' : 'DEBIT',
          description: `Performance test transaction ${i}`
        });
    }
  }

  async function cleanupTestData() {
    // Clean up test data
    await request(app)
      .delete('/api/test-data/cleanup')
      .set('Authorization', `Bearer ${accessToken}`);
  }

  describe('API Response Time Tests', () => {
    it('should respond to authentication requests within 200ms', async () => {
      const iterations = 10;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'perf.test@example.com',
            password: 'SecurePassword123!'
          })
          .expect(200);

        const end = performance.now();
        responseTimes.push(end - start);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(500);

      console.log(`Authentication - Average: ${averageResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms`);
    });

    it('should respond to task list requests within 300ms', async () => {
      const iterations = 10;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await request(app)
          .get('/api/compliance/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const end = performance.now();
        responseTimes.push(end - start);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(300);
      expect(maxResponseTime).toBeLessThan(1000);

      console.log(`Task List - Average: ${averageResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms`);
    });

    it('should respond to dashboard requests within 500ms', async () => {
      const iterations = 10;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await request(app)
          .get('/api/dashboard/metrics')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const end = performance.now();
        responseTimes.push(end - start);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(500);
      expect(maxResponseTime).toBeLessThan(2000);

      console.log(`Dashboard - Average: ${averageResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Load Tests', () => {
    it('should handle 100 concurrent authentication requests', async () => {
      const result = await autocannon({
        url: `${baseUrl}/api/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'perf.test@example.com',
          password: 'SecurePassword123!'
        }),
        connections: 100,
        duration: 10, // 10 seconds
        pipelining: 1
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.non2xx).toBe(0);
      expect(result.latency.average).toBeLessThan(1000);
      expect(result.requests.average).toBeGreaterThan(50);

      console.log(`Load Test Results:
        Requests/sec: ${result.requests.average}
        Average Latency: ${result.latency.average}ms
        95th Percentile: ${result.latency.p95}ms
        99th Percentile: ${result.latency.p99}ms
        Errors: ${result.errors}
        Timeouts: ${result.timeouts}`);
    });

    it('should handle 50 concurrent task list requests', async () => {
      const result = await autocannon({
        url: `${baseUrl}/api/compliance/tasks`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        connections: 50,
        duration: 10,
        pipelining: 1
      });

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      expect(result.non2xx).toBe(0);
      expect(result.latency.average).toBeLessThan(2000);
      expect(result.requests.average).toBeGreaterThan(25);

      console.log(`Task List Load Test:
        Requests/sec: ${result.requests.average}
        Average Latency: ${result.latency.average}ms
        95th Percentile: ${result.latency.p95}ms`);
    });

    it('should handle mixed workload efficiently', async () => {
      // Simulate realistic mixed workload
      const scenarios = [
        {
          url: `${baseUrl}/api/compliance/tasks`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          weight: 40 // 40% of requests
        },
        {
          url: `${baseUrl}/api/dashboard/metrics`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          weight: 30 // 30% of requests
        },
        {
          url: `${baseUrl}/api/customers`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          weight: 20 // 20% of requests
        },
        {
          url: `${baseUrl}/api/transactions`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          weight: 10 // 10% of requests
        }
      ];

      const results = await Promise.all(
        scenarios.map(scenario =>
          autocannon({
            url: scenario.url,
            method: scenario.method,
            headers: scenario.headers,
            connections: Math.floor(30 * scenario.weight / 100),
            duration: 15,
            pipelining: 1
          })
        )
      );

      // Verify all scenarios performed well
      results.forEach((result, index) => {
        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        expect(result.latency.average).toBeLessThan(3000);
        
        console.log(`Scenario ${index + 1} (${scenarios[index].url}):
          Requests/sec: ${result.requests.average}
          Average Latency: ${result.latency.average}ms`);
      });
    });
  });

  describe('Memory and Resource Tests', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate load for 30 seconds
      const result = await autocannon({
        url: `${baseUrl}/api/compliance/tasks`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        connections: 20,
        duration: 30,
        pipelining: 1
      });

      const finalMemory = process.memoryUsage();
      
      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(50);

      console.log(`Memory Usage:
        Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Increase: ${memoryIncrease.toFixed(2)}MB`);
    });

    it('should handle database connection pooling efficiently', async () => {
      // Test database connection under load
      const start = performance.now();
      
      const promises = Array(100).fill().map(async (_, index) => {
        return request(app)
          .get(`/api/compliance/tasks/${index % 10 + 1}`)
          .set('Authorization', `Bearer ${accessToken}`);
      });

      const results = await Promise.all(promises);
      const end = performance.now();

      // All requests should succeed
      const successfulRequests = results.filter(r => r.status === 200 || r.status === 404);
      expect(successfulRequests.length).toBe(100);

      // Total time should be reasonable
      const totalTime = end - start;
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds

      console.log(`Database Connection Test:
        Total Time: ${totalTime.toFixed(2)}ms
        Average per request: ${(totalTime / 100).toFixed(2)}ms`);
    });
  });

  describe('Stress Tests', () => {
    it('should gracefully handle overload conditions', async () => {
      // Gradually increase load to find breaking point
      const loadLevels = [10, 25, 50, 100, 200];
      const results = [];

      for (const connections of loadLevels) {
        const result = await autocannon({
          url: `${baseUrl}/api/compliance/tasks`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          connections,
          duration: 5,
          pipelining: 1
        });

        results.push({
          connections,
          requestsPerSec: result.requests.average,
          averageLatency: result.latency.average,
          errors: result.errors,
          timeouts: result.timeouts
        });

        console.log(`Load Level ${connections}: ${result.requests.average} req/sec, ${result.latency.average}ms avg latency`);
      }

      // System should handle at least 50 concurrent connections without errors
      const stableResult = results.find(r => r.connections === 50);
      expect(stableResult.errors).toBe(0);
      expect(stableResult.timeouts).toBe(0);
      expect(stableResult.averageLatency).toBeLessThan(5000);
    });

    it('should recover from high load conditions', async () => {
      // Apply high load
      const highLoadResult = await autocannon({
        url: `${baseUrl}/api/compliance/tasks`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        connections: 200,
        duration: 10,
        pipelining: 1
      });

      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test normal load after recovery
      const recoveryResult = await autocannon({
        url: `${baseUrl}/api/compliance/tasks`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        connections: 10,
        duration: 5,
        pipelining: 1
      });

      // System should recover to normal performance
      expect(recoveryResult.errors).toBe(0);
      expect(recoveryResult.timeouts).toBe(0);
      expect(recoveryResult.latency.average).toBeLessThan(1000);

      console.log(`Recovery Test:
        High Load Latency: ${highLoadResult.latency.average}ms
        Recovery Latency: ${recoveryResult.latency.average}ms`);
    });
  });
});
