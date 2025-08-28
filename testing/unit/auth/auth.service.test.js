// Unit Tests for Authentication Service
// Testing JWT token generation, validation, and user authentication

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthService } = require('../../../src/services/auth/auth.service');
const { UserRepository } = require('../../../src/repositories/user.repository');
const { TokenRepository } = require('../../../src/repositories/token.repository');
const { ValidationError, UnauthorizedError } = require('../../../src/utils/errors');

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/token.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService;
  let mockUserRepository;
  let mockTokenRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockUserRepository = new UserRepository();
    mockTokenRepository = new TokenRepository();
    
    // Create service instance
    authService = new AuthService(mockUserRepository, mockTokenRepository);
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      role: 'user'
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashed-password';
      const savedUser = { 
        id: 'user-id', 
        ...validUserData, 
        password: hashedPassword 
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(savedUser);

      // Act
      const result = await authService.register(validUserData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...validUserData,
        password: hashedPassword
      });
      expect(result).toEqual({
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role
      });
    });

    it('should throw ValidationError if user already exists', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

      // Act & Assert
      await expect(authService.register(validUserData))
        .rejects.toThrow(ValidationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid email format', async () => {
      // Arrange
      const invalidUserData = { ...validUserData, email: 'invalid-email' };

      // Act & Assert
      await expect(authService.register(invalidUserData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      // Arrange
      const weakPasswordData = { ...validUserData, password: '123' };

      // Act & Assert
      await expect(authService.register(weakPasswordData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: 'user',
      isActive: true,
      lastLoginAt: null
    };

    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      mockTokenRepository.create.mockResolvedValue({});
      mockUserRepository.updateLastLogin.mockResolvedValue({});

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockTokenRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        },
        accessToken,
        refreshToken
      });
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData))
        .rejects.toThrow(UnauthorizedError);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginData))
        .rejects.toThrow(UnauthorizedError);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
      bcrypt.compare.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(loginData))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('validateToken', () => {
    const validToken = 'valid-jwt-token';
    const mockPayload = {
      userId: 'user-id',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    it('should validate token successfully', async () => {
      // Arrange
      jwt.verify.mockReturnValue(mockPayload);
      mockTokenRepository.findByToken.mockResolvedValue({
        token: validToken,
        isRevoked: false
      });

      // Act
      const result = await authService.validateToken(validToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      // Arrange
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for revoked token', async () => {
      // Arrange
      jwt.verify.mockReturnValue(mockPayload);
      mockTokenRepository.findByToken.mockResolvedValue({
        token: validToken,
        isRevoked: true
      });

      // Act & Assert
      await expect(authService.validateToken(validToken))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = {
      userId: 'user-id',
      email: 'test@example.com',
      role: 'user',
      type: 'refresh'
    };

    it('should refresh token successfully', async () => {
      // Arrange
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      jwt.verify.mockReturnValue(mockPayload);
      mockTokenRepository.findByToken.mockResolvedValue({
        token: refreshToken,
        isRevoked: false
      });
      jwt.sign
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);
      mockTokenRepository.revokeToken.mockResolvedValue({});
      mockTokenRepository.create.mockResolvedValue({});

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledWith(refreshToken);
      expect(mockTokenRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      // Arrange
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken('invalid-refresh-token'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    it('should logout user successfully', async () => {
      // Arrange
      mockTokenRepository.revokeToken
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      // Act
      await authService.logout(accessToken, refreshToken);

      // Assert
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledTimes(2);
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledWith(accessToken);
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should handle logout with only access token', async () => {
      // Arrange
      mockTokenRepository.revokeToken.mockResolvedValue({});

      // Act
      await authService.logout(accessToken);

      // Assert
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledTimes(1);
      expect(mockTokenRepository.revokeToken).toHaveBeenCalledWith(accessToken);
    });
  });

  describe('changePassword', () => {
    const userId = 'user-id';
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';
    const mockUser = {
      id: userId,
      password: 'hashed-old-password'
    };

    it('should change password successfully', async () => {
      // Arrange
      const hashedNewPassword = 'hashed-new-password';
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue(hashedNewPassword);
      mockUserRepository.updatePassword.mockResolvedValue({});

      // Act
      await authService.changePassword(userId, oldPassword, newPassword);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(userId, hashedNewPassword);
    });

    it('should throw UnauthorizedError for incorrect old password', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword(userId, oldPassword, newPassword))
        .rejects.toThrow(UnauthorizedError);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for weak new password', async () => {
      // Arrange
      const weakPassword = '123';

      // Act & Assert
      await expect(authService.changePassword(userId, oldPassword, weakPassword))
        .rejects.toThrow(ValidationError);
    });
  });
});
