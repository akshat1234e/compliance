// Integration Tests for Authentication API
// Testing complete authentication flow with database and external services

const request = require('supertest');
const { app } = require('../../../src/app');
const { DatabaseService } = require('../../../src/services/database/database.service');
const { RedisService } = require('../../../src/services/cache/redis.service');
const { UserRepository } = require('../../../src/repositories/user.repository');
const { TokenRepository } = require('../../../src/repositories/token.repository');

describe('Authentication API Integration Tests', () => {
  let databaseService;
  let redisService;
  let userRepository;
  let tokenRepository;
  let testUser;

  beforeAll(async () => {
    // Initialize services
    databaseService = new DatabaseService();
    redisService = new RedisService();
    userRepository = new UserRepository();
    tokenRepository = new TokenRepository();

    // Connect to test database
    await databaseService.connect();
    await redisService.connect();

    // Clean up any existing test data
    await userRepository.deleteByEmail('integration.test@example.com');
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await userRepository.deleteById(testUser.id);
    }
    
    // Close connections
    await databaseService.disconnect();
    await redisService.disconnect();
  });

  beforeEach(async () => {
    // Clear Redis cache
    await redisService.flushAll();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'integration.test@example.com',
      password: 'SecurePassword123!',
      name: 'Integration Test User',
      role: 'user'
    };

    it('should register a new user successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: validRegistrationData.email,
            name: validRegistrationData.name,
            role: validRegistrationData.role
          }
        }
      });

      // Verify user was created in database
      const createdUser = await userRepository.findByEmail(validRegistrationData.email);
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(validRegistrationData.email);
      
      // Store for cleanup
      testUser = createdUser;
    });

    it('should return 400 for duplicate email', async () => {
      // Arrange - Create user first
      await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('already exists')
        }
      });
    });

    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email'
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          password: '123'
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginCredentials = {
      email: 'integration.test@example.com',
      password: 'SecurePassword123!'
    };

    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: loginCredentials.email,
          password: loginCredentials.password,
          name: 'Test User',
          role: 'user'
        });
    });

    it('should login user successfully with valid credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: loginCredentials.email
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });

      // Verify tokens are valid JWT format
      const { accessToken, refreshToken } = response.body.data;
      expect(accessToken.split('.')).toHaveLength(3);
      expect(refreshToken.split('.')).toHaveLength(3);

      // Verify tokens are stored in database
      const storedAccessToken = await tokenRepository.findByToken(accessToken);
      const storedRefreshToken = await tokenRepository.findByToken(refreshToken);
      expect(storedAccessToken).toBeTruthy();
      expect(storedRefreshToken).toBeTruthy();
    });

    it('should return 401 for invalid email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: loginCredentials.password
        })
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
    });

    it('should return 401 for invalid password', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginCredentials.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should update last login timestamp', async () => {
      // Arrange
      const userBefore = await userRepository.findByEmail(loginCredentials.email);
      const lastLoginBefore = userBefore.lastLoginAt;

      // Act
      await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);

      // Assert
      const userAfter = await userRepository.findByEmail(loginCredentials.email);
      expect(userAfter.lastLoginAt).not.toBe(lastLoginBefore);
      expect(new Date(userAfter.lastLoginAt)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create user and get refresh token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh.test@example.com',
          password: 'SecurePassword123!',
          name: 'Refresh Test User',
          role: 'user'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh.test@example.com',
          password: 'SecurePassword123!'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });

      // Verify new tokens are different
      expect(response.body.data.accessToken).not.toBe(refreshToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Verify old refresh token is revoked
      const oldToken = await tokenRepository.findByToken(refreshToken);
      expect(oldToken.isRevoked).toBe(true);
    });

    it('should return 401 for invalid refresh token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for revoked refresh token', async () => {
      // Arrange - Revoke the token first
      await tokenRepository.revokeToken(refreshToken);

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      // Create user and login to get tokens
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout.test@example.com',
          password: 'SecurePassword123!',
          name: 'Logout Test User',
          role: 'user'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout.test@example.com',
          password: 'SecurePassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout user successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully'
      });

      // Verify tokens are revoked
      const revokedAccessToken = await tokenRepository.findByToken(accessToken);
      const revokedRefreshToken = await tokenRepository.findByToken(refreshToken);
      expect(revokedAccessToken.isRevoked).toBe(true);
      expect(revokedRefreshToken.isRevoked).toBe(true);
    });

    it('should return 401 for invalid access token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;
    let userId;

    beforeEach(async () => {
      // Create user and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me.test@example.com',
          password: 'SecurePassword123!',
          name: 'Me Test User',
          role: 'user'
        });

      userId = registerResponse.body.data.user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me.test@example.com',
          password: 'SecurePassword123!'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return current user information', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: userId,
            email: 'me.test@example.com',
            name: 'Me Test User',
            role: 'user'
          }
        }
      });
    });

    it('should return 401 without access token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const loginData = {
        email: 'ratelimit.test@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);

      // First 5 should return 401, 6th should return 429 (rate limited)
      const statusCodes = responses.map(r => r.status);
      expect(statusCodes.filter(code => code === 401)).toHaveLength(5);
      expect(statusCodes.filter(code => code === 429)).toHaveLength(1);
    });
  });
});
