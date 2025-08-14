import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'
import { logger } from '../utils/logger'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        role: string
        permissions: string[]
      }
    }
  }
}

// Authentication middleware
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
    
    // Find user and check if still active
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user deactivated.' })
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      permissions: user.getRolePermissions()
    }

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    res.status(401).json({ message: 'Invalid token.' })
  }
}

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      })
    }

    next()
  }
}

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    try {
      const user = await User.findById(req.user.userId)
      if (!user) {
        return res.status(401).json({ message: 'User not found.' })
      }

      // Admin has all permissions
      if (user.role === 'admin') {
        return next()
      }

      // Check if user has the required permission
      if (!user.hasPermission(permission)) {
        return res.status(403).json({ 
          message: 'Access denied. Missing required permission.',
          required: permission,
          available: user.getRolePermissions()
        })
      }

      next()
    } catch (error) {
      logger.error('Permission check error:', error)
      res.status(500).json({ message: 'Server error during permission check.' })
    }
  }
}

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
      const user = await User.findById(decoded.userId)
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          permissions: user.getRolePermissions()
        }
      }
    }

    next()
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

// Middleware to check if user owns resource
export const checkOwnership = (resourceUserField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if the resource belongs to the user
    const resourceUserId = req.body[resourceUserField] || req.params[resourceUserField]
    
    if (resourceUserId && resourceUserId !== req.user.userId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own resources.' 
      })
    }

    next()
  }
}

// Middleware to validate API key for external integrations
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key')
  
  if (!apiKey) {
    return res.status(401).json({ message: 'API key required.' })
  }

  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ message: 'Invalid API key.' })
  }

  next()
}

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const userId = req.user.userId
    const now = Date.now()
    const userRequests = requests.get(userId)

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, { count: 1, resetTime: now + windowMs })
      return next()
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({ 
        message: 'Rate limit exceeded. Please try again later.',
        resetTime: new Date(userRequests.resetTime).toISOString()
      })
    }

    userRequests.count++
    next()
  }
}
