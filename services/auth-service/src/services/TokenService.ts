/**
 * JWT Token Management Service
 * Handles token generation, validation, and refresh mechanisms
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { logger } from '@utils/logger'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  permissions: string[]
  organizationId?: string
  sessionId: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface RefreshTokenData {
  userId: string
  sessionId: string
  deviceId?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  expiresAt: Date
  isRevoked: boolean
}

export class TokenService {
  private accessTokenSecret: string
  private refreshTokenSecret: string
  private accessTokenExpiry: string
  private refreshTokenExpiry: string
  private issuer: string
  private audience: string

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret()
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret()
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'
    this.issuer = process.env.JWT_ISSUER || 'rbi-compliance-platform'
    this.audience = process.env.JWT_AUDIENCE || 'rbi-compliance-users'
  }

  /**
   * Generate a new token pair (access + refresh tokens)
   */
  public generateTokenPair(payload: TokenPayload): TokenPair {
    try {
      const sessionId = payload.sessionId || this.generateSessionId()
      
      // Generate access token
      const accessTokenPayload = {
        ...payload,
        sessionId,
        type: 'access',
      }

      const accessToken = jwt.sign(accessTokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        jwtid: this.generateJwtId(),
      })

      // Generate refresh token
      const refreshTokenPayload = {
        userId: payload.userId,
        sessionId,
        type: 'refresh',
      }

      const refreshToken = jwt.sign(refreshTokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        jwtid: this.generateJwtId(),
      })

      // Calculate expiry time
      const expiresIn = this.parseExpiry(this.accessTokenExpiry)

      logger.info('Token pair generated', {
        userId: payload.userId,
        sessionId,
        expiresIn,
      })

      return {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer',
      }
    } catch (error) {
      logger.error('Failed to generate token pair', error)
      throw new Error('Token generation failed')
    }
  }

  /**
   * Validate and decode access token
   */
  public validateAccessToken(token: string): TokenPayload {
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
      logger.warn('Access token validation failed', {
        error: error.message,
        token: token.substring(0, 20) + '...',
      })
      throw new Error('Invalid access token')
    }
  }

  /**
   * Validate and decode refresh token
   */
  public validateRefreshToken(token: string): { userId: string; sessionId: string } {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as any

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      return {
        userId: decoded.sub || decoded.userId,
        sessionId: decoded.sessionId,
      }
    } catch (error) {
      logger.warn('Refresh token validation failed', {
        error: error.message,
        token: token.substring(0, 20) + '...',
      })
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(
    refreshToken: string,
    userPayload: TokenPayload
  ): Promise<TokenPair> {
    try {
      // Validate refresh token
      const refreshData = this.validateRefreshToken(refreshToken)
      
      if (refreshData.userId !== userPayload.userId) {
        throw new Error('Token user mismatch')
      }

      // Generate new token pair
      const newTokenPair = this.generateTokenPair({
        ...userPayload,
        sessionId: refreshData.sessionId,
      })

      logger.info('Access token refreshed', {
        userId: userPayload.userId,
        sessionId: refreshData.sessionId,
      })

      return newTokenPair
    } catch (error) {
      logger.error('Token refresh failed', error)
      throw new Error('Token refresh failed')
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  public decodeToken(token: string): any {
    try {
      return jwt.decode(token, { complete: true })
    } catch (error) {
      logger.error('Token decode failed', error)
      return null
    }
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.exp) {
        return true
      }
      
      const currentTime = Math.floor(Date.now() / 1000)
      return decoded.exp < currentTime
    } catch (error) {
      return true
    }
  }

  /**
   * Get token expiry time
   */
  public getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.exp) {
        return null
      }
      
      return new Date(decoded.exp * 1000)
    } catch (error) {
      return null
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  public async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.jti) {
        throw new Error('Invalid token format')
      }

      // Add token ID to blacklist (implement with Redis or database)
      await this.addToBlacklist(decoded.jti, decoded.exp)

      logger.info('Token revoked', {
        jti: decoded.jti,
        userId: decoded.sub || decoded.userId,
      })
    } catch (error) {
      logger.error('Token revocation failed', error)
      throw new Error('Token revocation failed')
    }
  }

  /**
   * Check if token is blacklisted
   */
  public async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.jti) {
        return true
      }

      return await this.isInBlacklist(decoded.jti)
    } catch (error) {
      return true
    }
  }

  // Private helper methods
  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private generateJwtId(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private parseExpiry(expiry: string): number {
    // Convert expiry string to seconds
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 900 // Default 15 minutes
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 60 * 60 * 24
      default: return 900
    }
  }

  private async addToBlacklist(jti: string, exp: number): Promise<void> {
    // Implement with Redis or database
    // For now, we'll use a simple in-memory store (not suitable for production)
    // In production, use Redis with TTL based on token expiry
    logger.info('Token added to blacklist', { jti, exp })
  }

  private async isInBlacklist(jti: string): Promise<boolean> {
    // Implement with Redis or database
    // For now, return false (not suitable for production)
    return false
  }
}

export default TokenService
