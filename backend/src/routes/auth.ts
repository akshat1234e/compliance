import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User'
import { auth, authorize } from '../middleware/auth'
import { asyncHandler, CustomError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

const router = express.Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Input validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('role').optional().isIn(['user', 'compliance_officer', 'risk_manager', 'admin'])
]

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]

// Register
router.post('/register', authLimiter, registerValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400)
  }

  const { email, password, name, role } = req.body

  // Check if user exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new CustomError('User already exists', 400)
  }

  // Hash password
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const user = new User({
    email,
    password: hashedPassword,
    name,
    role: role || 'user',
    isActive: true,
    profile: {
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    }
  })

  await user.save()

  // Generate JWT with refresh token
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  logger.info(`New user registered: ${email}`)

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    }
  })
}))

// Login
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400)
  }

  const { email, password } = req.body

  // Find user
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new CustomError('Invalid credentials', 400)
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account is deactivated', 403)
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new CustomError('Invalid credentials', 400)
  }

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  // Generate JWT with refresh token
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  logger.info(`User logged in: ${email}`)

  res.json({
    success: true,
    message: 'Login successful',
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: user.getRolePermissions()
    }
  })
}))

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies

  if (!refreshToken) {
    throw new CustomError('Refresh token not provided', 401)
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret') as any
  
  // Find user
  const user = await User.findById(decoded.userId)
  if (!user || !user.isActive) {
    throw new CustomError('Invalid refresh token', 401)
  }

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )

  res.json({
    success: true,
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      permissions: user.getRolePermissions()
    }
  })
}))

// Get current user
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.userId)
  if (!user) {
    throw new CustomError('User not found', 404)
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      profile: user.profile,
      permissions: user.getRolePermissions(),
      createdAt: user.createdAt
    }
  })
}))

// Logout
router.post('/logout', auth, asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken')
  
  logger.info(`User logged out: ${req.user!.email}`)
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}))

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400)
  }

  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user!.userId).select('+password')

  if (!user) {
    throw new CustomError('User not found', 404)
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    throw new CustomError('Current password is incorrect', 400)
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  // Update password
  user.password = hashedPassword
  await user.save()

  logger.info(`Password changed for user: ${user.email}`)

  res.json({
    success: true,
    message: 'Password changed successfully'
  })
}))

// Update profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('profile.phone').optional().isMobilePhone('any'),
  body('profile.department').optional().trim().isLength({ max: 100 }),
  body('profile.designation').optional().trim().isLength({ max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400)
  }

  const user = await User.findById(req.user!.userId)
  if (!user) {
    throw new CustomError('User not found', 404)
  }

  // Update allowed fields
  const { name, profile } = req.body
  
  if (name) user.name = name
  if (profile) {
    user.profile = { ...user.profile, ...profile }
  }

  await user.save()

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile
    }
  })
}))

export default router
