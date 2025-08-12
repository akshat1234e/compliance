/**
 * OAuth 2.0 Authentication Service
 * Implements OAuth 2.0 server with support for multiple identity providers
 */

import crypto from 'crypto'
import { EventEmitter } from 'events'
import { TokenService } from './TokenService'
import { RBACService } from './RBACService'
import { logger } from '@utils/logger'

export interface OAuth2Client {
  clientId: string
  clientSecret: string
  name: string
  redirectUris: string[]
  scopes: string[]
  grantTypes: ('authorization_code' | 'client_credentials' | 'refresh_token')[]
  isActive: boolean
  createdAt: Date
}

export interface AuthorizationCode {
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scopes: string[]
  expiresAt: Date
  isUsed: boolean
}

export interface AccessTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface IdentityProvider {
  id: string
  name: string
  type: 'google' | 'microsoft' | 'okta' | 'ldap' | 'saml'
  config: Record<string, any>
  isActive: boolean
}

export class OAuth2Service extends EventEmitter {
  private tokenService: TokenService
  private rbacService: RBACService
  private clients: Map<string, OAuth2Client> = new Map()
  private authorizationCodes: Map<string, AuthorizationCode> = new Map()
  private identityProviders: Map<string, IdentityProvider> = new Map()

  constructor(tokenService: TokenService, rbacService: RBACService) {
    super()
    this.tokenService = tokenService
    this.rbacService = rbacService
    this.initializeDefaultClients()
    this.initializeIdentityProviders()
  }

  /**
   * Authorization Code Flow - Step 1: Generate authorization URL
   */
  public generateAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scopes: string[],
    state?: string
  ): string {
    const client = this.clients.get(clientId)
    if (!client || !client.isActive) {
      throw new Error('Invalid client')
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid redirect URI')
    }

    if (!this.validateScopes(scopes, client.scopes)) {
      throw new Error('Invalid scopes')
    }

    const authCode = this.generateAuthorizationCode(clientId, redirectUri, scopes)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      code: authCode,
    })

    if (state) {
      params.append('state', state)
    }

    return `/oauth/authorize?${params.toString()}`
  }

  /**
   * Authorization Code Flow - Step 2: Exchange code for tokens
   */
  public async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<AccessTokenResponse> {
    // Validate client credentials
    const client = await this.validateClient(clientId, clientSecret)
    if (!client) {
      throw new Error('Invalid client credentials')
    }

    // Validate authorization code
    const authCode = this.authorizationCodes.get(code)
    if (!authCode || authCode.isUsed || authCode.expiresAt < new Date()) {
      throw new Error('Invalid or expired authorization code')
    }

    if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
      throw new Error('Authorization code mismatch')
    }

    // Mark code as used
    authCode.isUsed = true

    // Get user information
    const user = await this.getUserById(authCode.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate tokens
    const tokenPair = this.tokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: await this.rbacService.getUserPermissions(user.id),
      organizationId: user.organizationId,
      sessionId: crypto.randomBytes(16).toString('hex'),
    })

    logger.info('OAuth2 tokens issued', {
      clientId,
      userId: user.id,
      scopes: authCode.scopes,
    })

    return {
      access_token: tokenPair.accessToken,
      token_type: 'Bearer',
      expires_in: tokenPair.expiresIn,
      refresh_token: tokenPair.refreshToken,
      scope: authCode.scopes.join(' '),
    }
  }

  /**
   * Client Credentials Flow
   */
  public async clientCredentialsGrant(
    clientId: string,
    clientSecret: string,
    scopes: string[]
  ): Promise<AccessTokenResponse> {
    const client = await this.validateClient(clientId, clientSecret)
    if (!client) {
      throw new Error('Invalid client credentials')
    }

    if (!client.grantTypes.includes('client_credentials')) {
      throw new Error('Client credentials grant not allowed for this client')
    }

    if (!this.validateScopes(scopes, client.scopes)) {
      throw new Error('Invalid scopes')
    }

    // Generate service account token
    const tokenPair = this.tokenService.generateTokenPair({
      userId: `service_${clientId}`,
      email: `${clientId}@service.rbi-compliance.com`,
      role: 'service_account',
      permissions: scopes,
      sessionId: crypto.randomBytes(16).toString('hex'),
    })

    logger.info('Client credentials tokens issued', {
      clientId,
      scopes,
    })

    return {
      access_token: tokenPair.accessToken,
      token_type: 'Bearer',
      expires_in: tokenPair.expiresIn,
      scope: scopes.join(' '),
    }
  }

  /**
   * Refresh Token Flow
   */
  public async refreshTokenGrant(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<AccessTokenResponse> {
    const client = await this.validateClient(clientId, clientSecret)
    if (!client) {
      throw new Error('Invalid client credentials')
    }

    if (!client.grantTypes.includes('refresh_token')) {
      throw new Error('Refresh token grant not allowed for this client')
    }

    try {
      const refreshData = this.tokenService.validateRefreshToken(refreshToken)
      const user = await this.getUserById(refreshData.userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      const tokenPair = await this.tokenService.refreshAccessToken(refreshToken, {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: await this.rbacService.getUserPermissions(user.id),
        organizationId: user.organizationId,
        sessionId: refreshData.sessionId,
      })

      logger.info('Tokens refreshed', {
        clientId,
        userId: user.id,
      })

      return {
        access_token: tokenPair.accessToken,
        token_type: 'Bearer',
        expires_in: tokenPair.expiresIn,
        refresh_token: tokenPair.refreshToken,
        scope: 'openid profile email',
      }
    } catch (error) {
      logger.error('Refresh token validation failed', error)
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Identity Provider Integration
   */
  public async authenticateWithProvider(
    providerId: string,
    providerToken: string
  ): Promise<{ user: any; tokens: AccessTokenResponse }> {
    const provider = this.identityProviders.get(providerId)
    if (!provider || !provider.isActive) {
      throw new Error('Invalid identity provider')
    }

    let userInfo: any
    
    switch (provider.type) {
      case 'google':
        userInfo = await this.validateGoogleToken(providerToken, provider.config)
        break
      case 'microsoft':
        userInfo = await this.validateMicrosoftToken(providerToken, provider.config)
        break
      case 'okta':
        userInfo = await this.validateOktaToken(providerToken, provider.config)
        break
      default:
        throw new Error('Unsupported identity provider')
    }

    // Find or create user
    let user = await this.findUserByEmail(userInfo.email)
    if (!user) {
      user = await this.createUserFromProvider(userInfo, providerId)
    }

    // Generate tokens
    const tokenPair = this.tokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: await this.rbacService.getUserPermissions(user.id),
      organizationId: user.organizationId,
      sessionId: crypto.randomBytes(16).toString('hex'),
    })

    const tokens: AccessTokenResponse = {
      access_token: tokenPair.accessToken,
      token_type: 'Bearer',
      expires_in: tokenPair.expiresIn,
      refresh_token: tokenPair.refreshToken,
      scope: 'openid profile email',
    }

    logger.info('User authenticated with identity provider', {
      providerId,
      userId: user.id,
      email: user.email,
    })

    return { user, tokens }
  }

  /**
   * Client Management
   */
  public async registerClient(client: Omit<OAuth2Client, 'clientSecret' | 'createdAt'>): Promise<OAuth2Client> {
    const clientSecret = this.generateClientSecret()
    
    const newClient: OAuth2Client = {
      ...client,
      clientSecret,
      createdAt: new Date(),
    }

    this.clients.set(client.clientId, newClient)

    logger.info('OAuth2 client registered', {
      clientId: client.clientId,
      name: client.name,
    })

    return newClient
  }

  public async updateClient(clientId: string, updates: Partial<OAuth2Client>): Promise<OAuth2Client> {
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const updatedClient = { ...client, ...updates }
    this.clients.set(clientId, updatedClient)

    logger.info('OAuth2 client updated', { clientId })
    return updatedClient
  }

  public async revokeClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    client.isActive = false
    logger.info('OAuth2 client revoked', { clientId })
  }

  // Private helper methods
  private generateAuthorizationCode(clientId: string, redirectUri: string, scopes: string[]): string {
    const code = crypto.randomBytes(32).toString('hex')
    
    const authCode: AuthorizationCode = {
      code,
      clientId,
      userId: 'temp_user_id', // This would be set during actual authorization
      redirectUri,
      scopes,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isUsed: false,
    }

    this.authorizationCodes.set(code, authCode)
    return code
  }

  private async validateClient(clientId: string, clientSecret: string): Promise<OAuth2Client | null> {
    const client = this.clients.get(clientId)
    if (!client || !client.isActive) {
      return null
    }

    // Use constant-time comparison to prevent timing attacks
    const providedSecret = Buffer.from(clientSecret, 'utf8')
    const actualSecret = Buffer.from(client.clientSecret, 'utf8')
    
    if (providedSecret.length !== actualSecret.length) {
      return null
    }

    const isValid = crypto.timingSafeEqual(providedSecret, actualSecret)
    return isValid ? client : null
  }

  private validateScopes(requestedScopes: string[], allowedScopes: string[]): boolean {
    return requestedScopes.every(scope => allowedScopes.includes(scope))
  }

  private generateClientSecret(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private async validateGoogleToken(token: string, config: any): Promise<any> {
    // Implement Google token validation
    // This would make a request to Google's token info endpoint
    throw new Error('Google token validation not implemented')
  }

  private async validateMicrosoftToken(token: string, config: any): Promise<any> {
    // Implement Microsoft token validation
    throw new Error('Microsoft token validation not implemented')
  }

  private async validateOktaToken(token: string, config: any): Promise<any> {
    // Implement Okta token validation
    throw new Error('Okta token validation not implemented')
  }

  private async getUserById(userId: string): Promise<any> {
    // Implement user lookup by ID
    // This would query the user database
    return {
      id: userId,
      email: 'demo@rbi-compliance.com',
      role: 'admin',
      organizationId: 'org_1',
    }
  }

  private async findUserByEmail(email: string): Promise<any> {
    // Implement user lookup by email
    return null
  }

  private async createUserFromProvider(userInfo: any, providerId: string): Promise<any> {
    // Implement user creation from identity provider info
    const newUser = {
      id: crypto.randomUUID(),
      email: userInfo.email,
      name: userInfo.name,
      role: 'viewer', // Default role
      organizationId: 'org_1',
      providerId,
      createdAt: new Date(),
    }

    logger.info('User created from identity provider', {
      userId: newUser.id,
      email: newUser.email,
      providerId,
    })

    return newUser
  }

  private initializeDefaultClients(): void {
    // Register default OAuth2 clients
    const defaultClient: OAuth2Client = {
      clientId: 'rbi-compliance-frontend',
      clientSecret: crypto.randomBytes(32).toString('hex'),
      name: 'RBI Compliance Frontend',
      redirectUris: ['http://localhost:3001/auth/callback', 'https://app.rbi-compliance.com/auth/callback'],
      scopes: ['openid', 'profile', 'email', 'read', 'write'],
      grantTypes: ['authorization_code', 'refresh_token'],
      isActive: true,
      createdAt: new Date(),
    }

    this.clients.set(defaultClient.clientId, defaultClient)
    logger.info('Default OAuth2 clients initialized')
  }

  private initializeIdentityProviders(): void {
    // Initialize identity providers
    const googleProvider: IdentityProvider = {
      id: 'google',
      name: 'Google',
      type: 'google',
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      isActive: !!process.env.GOOGLE_CLIENT_ID,
    }

    this.identityProviders.set('google', googleProvider)
    logger.info('Identity providers initialized')
  }
}

export default OAuth2Service
