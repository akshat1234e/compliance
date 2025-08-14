import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = Router();

// Mock user database (replace with actual database)
const users = [
  {
    id: '1',
    email: 'admin@compliance.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin User',
    role: 'admin',
    organization: 'RBI Compliance Platform',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@compliance.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Regular User',
    role: 'user',
    organization: 'RBI Compliance Platform',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email && u.isActive);
    if (!user) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn(`Login attempt with invalid password for: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'development_refresh_secret',
      { expiresIn: '7d' }
    );

    logger.info(`Successful login for user: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login',
    });
  }
});

// Register endpoint (for demo purposes)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password, name, organization } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      organization: organization || 'Default Organization',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          organization: newUser.organization,
        },
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during registration',
    });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  // In a real implementation, you would invalidate the token
  logger.info('User logged out');
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Refresh token endpoint
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'No refresh token provided',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'development_refresh_secret'
    ) as any;

    // Find user
    const user = users.find(u => u.id === decoded.userId && u.isActive);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'User not found or inactive',
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Failed to refresh token',
    });
  }
});

// Get current user endpoint
router.get('/me', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'development_secret'
    ) as any;

    const user = users.find(u => u.id === decoded.userId && u.isActive);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
        },
      },
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Failed to authenticate token',
    });
  }
});

export { router as authRoutes };
