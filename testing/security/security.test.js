// Security Tests for RBI Compliance Platform
// Testing authentication, authorization, input validation, and security vulnerabilities

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../../src/app');
const { DatabaseService } = require('../../src/services/database/database.service');

describe('Security Tests', () => {
  let databaseService;
  let testUser;
  let accessToken;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.connect();

    // Create test users
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'security.user@example.com',
        password: 'SecurePassword123!',
        name: 'Security Test User',
        role: 'user'
      });

    testUser = userResponse.body.data.user;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'security.user@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = userLogin.body.data.accessToken;

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'security.admin@example.com',
        password: 'AdminPassword123!',
        name: 'Security Admin User',
        role: 'admin'
      });

    adminUser = adminResponse.body.data.user;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'security.admin@example.com',
        password: 'AdminPassword123!'
      });

    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test users
    await request(app)
      .delete(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    await request(app)
      .delete(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    await databaseService.disconnect();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/compliance/tasks')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/compliance/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject expired JWT tokens', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/compliance/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject tampered JWT tokens', async () => {
      // Tamper with the token
      const tamperedToken = accessToken.slice(0, -5) + 'XXXXX';

      const response = await request(app)
        .get('/api/compliance/tasks')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      const statusCodes = responses.map(r => r.status);

      // Should have rate limiting after 5 attempts
      expect(statusCodes.filter(code => code === 429)).toBeGreaterThan(0);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      // Regular user trying to access admin endpoint
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    });

    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent users from accessing other users\' data', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other.user@example.com',
          password: 'OtherPassword123!',
          name: 'Other User',
          role: 'user'
        });

      const otherUserId = otherUserResponse.body.data.user.id;

      // Try to access other user's profile
      const response = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app)
        .post('/api/compliance/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: maliciousInput,
          category: 'REGULATORY_REPORTING',
          description: 'Test task',
          dueDate: new Date().toISOString(),
          priority: 'MEDIUM'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent XSS attacks in input fields', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/compliance/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: xssPayload,
          category: 'REGULATORY_REPORTING',
          description: 'Test task',
          dueDate: new Date().toISOString(),
          priority: 'MEDIUM'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@example',
        'user@.example.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPassword123!',
            name: 'Test User',
            role: 'user'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'Password',
        'Password123',
        '12345678',
        'abcdefgh',
        'ABCDEFGH'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password,
            name: 'Test User',
            role: 'user'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should sanitize file upload inputs', async () => {
      // Test malicious filename
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('test content'), '../../../etc/passwd')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Protection Security', () => {
    it('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userData = response.body.data.user;
      
      // Should not expose password hash or other sensitive fields
      expect(userData.password).toBeUndefined();
      expect(userData.passwordHash).toBeUndefined();
      expect(userData.salt).toBeUndefined();
      expect(userData.resetToken).toBeUndefined();
    });

    it('should encrypt sensitive data in database', async () => {
      // Create a customer with sensitive data
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          phone: '+91-9876543210',
          address: 'Sensitive Address Information',
          panNumber: 'ABCDE1234F',
          aadharNumber: '123456789012'
        })
        .expect(201);

      const customerId = customerResponse.body.data.customer.id;

      // Verify sensitive fields are not returned in plain text
      const getResponse = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const customer = getResponse.body.data.customer;
      
      // PAN and Aadhar should be masked or encrypted
      expect(customer.panNumber).toMatch(/\*+/);
      expect(customer.aadharNumber).toMatch(/\*+/);
    });

    it('should implement proper session management', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security.user@example.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      const { accessToken: newAccessToken, refreshToken } = loginResponse.body.data;

      // Logout should invalidate tokens
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Using invalidated token should fail
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should not expose server information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should not expose server details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Security', () => {
    it('should enforce CORS policy', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      // Should not allow arbitrary origins
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });

    it('should allow configured origins', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://rbi-compliance.com')
        .expect(200);

      // Should allow configured origin
      expect(response.headers['access-control-allow-origin']).toBe('https://rbi-compliance.com');
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types', async () => {
      // Try to upload executable file
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('#!/bin/bash\necho "malicious"'), 'malicious.sh')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('file type');
    });

    it('should enforce file size limits', async () => {
      // Try to upload large file
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', largeBuffer, 'large-file.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('file size');
    });

    it('should scan uploaded files for malware', async () => {
      // Mock malware signature
      const maliciousContent = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', maliciousContent, 'test.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('security scan');
    });
  });

  describe('Audit and Logging Security', () => {
    it('should log security events', async () => {
      // Failed login attempt
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security.user@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      // Verify security event is logged
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          action: 'LOGIN_FAILED',
          limit: 1
        })
        .expect(200);

      expect(auditResponse.body.data.logs).toHaveLength(1);
      expect(auditResponse.body.data.logs[0].action).toBe('LOGIN_FAILED');
    });

    it('should not log sensitive information', async () => {
      // Make request with sensitive data
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security.user@example.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      // Check audit logs don't contain password
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          action: 'LOGIN_SUCCESS',
          limit: 1
        })
        .expect(200);

      const logEntry = auditResponse.body.data.logs[0];
      expect(JSON.stringify(logEntry)).not.toContain('SecurePassword123!');
    });
  });
});
