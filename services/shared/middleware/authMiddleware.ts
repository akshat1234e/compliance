/**
 * Authentication Middleware
 * Validates JWT tokens and enforces authentication across all microservices
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '@utils/logger'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
    permissions: string[]
    organizationId?: string
    sessionId: string
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean
  roles?: string[]
  permissions?: string[]
  skipPaths?: string[]
}

export class AuthMiddleware {
  private accessTokenSecret: string
  private issuer: string
  private audience: string

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || ''
    this.issuer = process.env.JWT_ISSUER || 'rbi-compliance-platform'
    this.audience = process.env.JWT_AUDIENCE || 'rbi-compliance-users'

    if (!this.accessTokenSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required')
    }
  }

  /**
   * Main authentication middleware
   */
  public authenticate(options: AuthMiddlewareOptions = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // Skip authentication for certain paths
        if (options.skipPaths && this.shouldSkipPath(req.path, options.skipPaths)) {
          return next()
        }

        // Extract token from request
        const token = this.extractToken(req)

        if (!token) {
          if (options.required !== false) {
            return this.sendUnauthorized(res, 'No authentication token provided')
          }
          return next()
        }

        // Validate token
        const payload = await this.validateToken(token)
        if (!payload) {
          return this.sendUnauthorized(res, 'Invalid authentication token')
        }

        // Check if token is blacklisted
        if (await this.isTokenBlacklisted(token)) {
          return this.sendUnauthorized(res, 'Token has been revoked')
        }

        // Attach user to request
        req.user = payload

        // Check role requirements
        if (options.roles && !this.hasRequiredRole(payload.role, options.roles)) {
          return this.sendForbidden(res, 'Insufficient role permissions')
        }

        // Check permission requirements
        if (options.permissions && !this.hasRequiredPermissions(payload.permissions, options.permissions)) {
          return this.sendForbidden(res, 'Insufficient permissions')
        }

        // Log successful authentication
        logger.debug('User authenticated', {
          userId: payload.userId,
          role: payload.role,
          path: req.path,
          method: req.method,
        })

        next()
      } catch (error) {
        logger.error('Authentication middleware error', error)
        return this.sendUnauthorized(res, 'Authentication failed')
      }
    }
  }

  /**
   * Require authentication (shorthand)
   */
  public requireAuth() {
    return this.authenticate({ required: true })
  }

  /**
   * Require specific roles
   */
  public requireRoles(roles: string[]) {
    return this.authenticate({ required: true, roles })
  }

  /**
   * Require specific permissions
   */
  public requirePermissions(permissions: string[]) {
    return this.authenticate({ required: true, permissions })
  }

  /**
   * Optional authentication
   */
  public optionalAuth() {
    return this.authenticate({ required: false })
  }

  /**
   * Admin only middleware
   */
  public adminOnly() {
    return this.authenticate({ 
      required: true, 
      roles: ['admin', 'super_admin'] 
    })
  }

  /**
   * API key authentication middleware
   */
  public authenticateApiKey(validApiKeys: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string

      if (!apiKey) {
        return this.sendUnauthorized(res, 'API key required')
      }

      if (!validApiKeys.includes(apiKey)) {
        return this.sendUnauthorized(res, 'Invalid API key')
      }

      logger.debug('API key authenticated', {
        path: req.path,
        method: req.method,
      })

      next()
    }
  }

  // Private helper methods
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Check query parameter (for WebSocket connections)
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token
    }

    // Check cookie
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken
    }

    return null
  }

  private async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as any

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type')
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        organizationId: decoded.organizationId,
        sessionId: decoded.sessionId,
      }
    } catch (error) {
      logger.warn('Token validation failed', {
        error: error.message,
        token: token.substring(0, 20) + '...',
      })
      return null
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.jti) {
        return true
      }

      // Check blacklist (implement with Redis or database)
      // For now, return false (not suitable for production)
      return false
    } catch (error) {
      return true
    }
  }

  private hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole)
  }

  private hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission))
  }

  private shouldSkipPath(path: string, skipPaths: string[]): boolean {
    return skipPaths.some(skipPath => {
      if (skipPath.includes('*')) {
        const regex = new RegExp(skipPath.replace(/\*/g, '.*'))
        return regex.test(path)
      }
      return path === skipPath
    })
  }

  private sendUnauthorized(res: Response, message: string) {
    return res.status(401).json({
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString(),
    })
  }

  private sendForbidden(res: Response, message: string) {
    return res.status(403).json({
      error: 'Forbidden',
      message,
      timestamp: new Date().toISOString(),
    })
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware()

// Export convenience functions
export const requireAuth = () => authMiddleware.requireAuth()
export const requireRoles = (roles: string[]) => authMiddleware.requireRoles(roles)
export const requirePermissions = (permissions: string[]) => authMiddleware.requirePermissions(permissions)
export const optionalAuth = () => authMiddleware.optionalAuth()
export const adminOnly = () => authMiddleware.adminOnly()
export const authenticateApiKey = (validApiKeys: string[]) => authMiddleware.authenticateApiKey(validApiKeys)

export default authMiddleware
