/**
 * Role-Based Access Control (RBAC) Service
 * Manages roles, permissions, and resource-based access control
 */

import { logger } from '@utils/logger'

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  conditions?: Record<string, any>
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  isSystem: boolean
  organizationId?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserRole {
  userId: string
  roleId: string
  organizationId?: string
  assignedBy: string
  assignedAt: Date
  expiresAt?: Date
  isActive: boolean
}

export interface AccessContext {
  userId: string
  organizationId?: string
  resource: string
  action: string
  resourceId?: string
  metadata?: Record<string, any>
}

export class RBACService {
  private permissions: Map<string, Permission> = new Map()
  private roles: Map<string, Role> = new Map()
  private userRoles: Map<string, UserRole[]> = new Map()

  constructor() {
    this.initializeDefaultPermissions()
    this.initializeDefaultRoles()
  }

  /**
   * Initialize default system permissions
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      // Dashboard permissions
      { id: 'dashboard:read', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
      { id: 'dashboard:admin', name: 'Admin Dashboard', resource: 'dashboard', action: 'admin' },

      // Connector permissions
      { id: 'connectors:read', name: 'View Connectors', resource: 'connectors', action: 'read' },
      { id: 'connectors:write', name: 'Manage Connectors', resource: 'connectors', action: 'write' },
      { id: 'connectors:admin', name: 'Admin Connectors', resource: 'connectors', action: 'admin' },

      // Monitoring permissions
      { id: 'monitoring:read', name: 'View Monitoring', resource: 'monitoring', action: 'read' },
      { id: 'monitoring:write', name: 'Manage Monitoring', resource: 'monitoring', action: 'write' },
      { id: 'monitoring:admin', name: 'Admin Monitoring', resource: 'monitoring', action: 'admin' },

      // Webhook permissions
      { id: 'webhooks:read', name: 'View Webhooks', resource: 'webhooks', action: 'read' },
      { id: 'webhooks:write', name: 'Manage Webhooks', resource: 'webhooks', action: 'write' },
      { id: 'webhooks:admin', name: 'Admin Webhooks', resource: 'webhooks', action: 'admin' },

      // Compliance permissions
      { id: 'compliance:read', name: 'View Compliance', resource: 'compliance', action: 'read' },
      { id: 'compliance:write', name: 'Manage Compliance', resource: 'compliance', action: 'write' },
      { id: 'compliance:admin', name: 'Admin Compliance', resource: 'compliance', action: 'admin' },

      // Workflow permissions
      { id: 'workflows:read', name: 'View Workflows', resource: 'workflows', action: 'read' },
      { id: 'workflows:write', name: 'Manage Workflows', resource: 'workflows', action: 'write' },
      { id: 'workflows:execute', name: 'Execute Workflows', resource: 'workflows', action: 'execute' },
      { id: 'workflows:admin', name: 'Admin Workflows', resource: 'workflows', action: 'admin' },

      // Document permissions
      { id: 'documents:read', name: 'View Documents', resource: 'documents', action: 'read' },
      { id: 'documents:write', name: 'Manage Documents', resource: 'documents', action: 'write' },
      { id: 'documents:delete', name: 'Delete Documents', resource: 'documents', action: 'delete' },
      { id: 'documents:admin', name: 'Admin Documents', resource: 'documents', action: 'admin' },

      // User management permissions
      { id: 'users:read', name: 'View Users', resource: 'users', action: 'read' },
      { id: 'users:write', name: 'Manage Users', resource: 'users', action: 'write' },
      { id: 'users:admin', name: 'Admin Users', resource: 'users', action: 'admin' },

      // System permissions
      { id: 'system:read', name: 'View System', resource: 'system', action: 'read' },
      { id: 'system:write', name: 'Manage System', resource: 'system', action: 'write' },
      { id: 'system:admin', name: 'Admin System', resource: 'system', action: 'admin' },

      // Audit permissions
      { id: 'audit:read', name: 'View Audit Logs', resource: 'audit', action: 'read' },
      { id: 'audit:admin', name: 'Admin Audit Logs', resource: 'audit', action: 'admin' },
    ]

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission)
    })

    logger.info('Default permissions initialized', { count: defaultPermissions.length })
  }

  /**
   * Initialize default system roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: Array.from(this.permissions.keys()),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Administrative access to most features',
        permissions: [
          'dashboard:read', 'dashboard:admin',
          'connectors:read', 'connectors:write', 'connectors:admin',
          'monitoring:read', 'monitoring:write', 'monitoring:admin',
          'webhooks:read', 'webhooks:write', 'webhooks:admin',
          'compliance:read', 'compliance:write', 'compliance:admin',
          'workflows:read', 'workflows:write', 'workflows:execute', 'workflows:admin',
          'documents:read', 'documents:write', 'documents:delete',
          'users:read', 'users:write',
          'audit:read',
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'compliance_officer',
        name: 'Compliance Officer',
        description: 'Access to compliance and regulatory features',
        permissions: [
          'dashboard:read',
          'connectors:read',
          'monitoring:read',
          'webhooks:read',
          'compliance:read', 'compliance:write', 'compliance:admin',
          'workflows:read', 'workflows:write', 'workflows:execute',
          'documents:read', 'documents:write',
          'audit:read',
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'analyst',
        name: 'Analyst',
        description: 'Read access to monitoring and compliance data',
        permissions: [
          'dashboard:read',
          'connectors:read',
          'monitoring:read',
          'webhooks:read',
          'compliance:read',
          'workflows:read',
          'documents:read',
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'operator',
        name: 'Operator',
        description: 'Operational access to connectors and monitoring',
        permissions: [
          'dashboard:read',
          'connectors:read', 'connectors:write',
          'monitoring:read', 'monitoring:write',
          'webhooks:read', 'webhooks:write',
          'workflows:read', 'workflows:execute',
          'documents:read',
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to most features',
        permissions: [
          'dashboard:read',
          'connectors:read',
          'monitoring:read',
          'webhooks:read',
          'compliance:read',
          'workflows:read',
          'documents:read',
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role)
    })

    logger.info('Default roles initialized', { count: defaultRoles.length })
  }

  /**
   * Check if user has permission for a specific action
   */
  public async hasPermission(context: AccessContext): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(context.userId, context.organizationId)
      
      if (!userRoles || userRoles.length === 0) {
        return false
      }

      // Check if any of the user's roles has the required permission
      for (const userRole of userRoles) {
        if (!userRole.isActive) continue
        
        // Check if role is expired
        if (userRole.expiresAt && userRole.expiresAt < new Date()) continue

        const role = this.roles.get(userRole.roleId)
        if (!role) continue

        // Check if role has the specific permission
        const permissionId = `${context.resource}:${context.action}`
        if (role.permissions.includes(permissionId)) {
          return true
        }

        // Check for admin permission on the resource
        const adminPermissionId = `${context.resource}:admin`
        if (role.permissions.includes(adminPermissionId)) {
          return true
        }

        // Check for system admin permission
        if (role.permissions.includes('system:admin')) {
          return true
        }
      }

      return false
    } catch (error) {
      logger.error('Permission check failed', error)
      return false
    }
  }

  /**
   * Get user's effective permissions
   */
  public async getUserPermissions(userId: string, organizationId?: string): Promise<string[]> {
    try {
      const userRoles = await this.getUserRoles(userId, organizationId)
      const permissions = new Set<string>()

      for (const userRole of userRoles) {
        if (!userRole.isActive) continue
        if (userRole.expiresAt && userRole.expiresAt < new Date()) continue

        const role = this.roles.get(userRole.roleId)
        if (role) {
          role.permissions.forEach(permission => permissions.add(permission))
        }
      }

      return Array.from(permissions)
    } catch (error) {
      logger.error('Failed to get user permissions', error)
      return []
    }
  }

  /**
   * Assign role to user
   */
  public async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    organizationId?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const role = this.roles.get(roleId)
      if (!role) {
        throw new Error(`Role not found: ${roleId}`)
      }

      const userRole: UserRole = {
        userId,
        roleId,
        organizationId,
        assignedBy,
        assignedAt: new Date(),
        expiresAt,
        isActive: true,
      }

      const existingRoles = this.userRoles.get(userId) || []
      existingRoles.push(userRole)
      this.userRoles.set(userId, existingRoles)

      logger.info('Role assigned to user', {
        userId,
        roleId,
        assignedBy,
        organizationId,
      })
    } catch (error) {
      logger.error('Failed to assign role', error)
      throw error
    }
  }

  /**
   * Remove role from user
   */
  public async removeRole(userId: string, roleId: string, organizationId?: string): Promise<void> {
    try {
      const userRoles = this.userRoles.get(userId) || []
      const filteredRoles = userRoles.filter(ur => 
        !(ur.roleId === roleId && ur.organizationId === organizationId)
      )
      
      this.userRoles.set(userId, filteredRoles)

      logger.info('Role removed from user', {
        userId,
        roleId,
        organizationId,
      })
    } catch (error) {
      logger.error('Failed to remove role', error)
      throw error
    }
  }

  /**
   * Get user roles
   */
  public async getUserRoles(userId: string, organizationId?: string): Promise<UserRole[]> {
    const userRoles = this.userRoles.get(userId) || []
    return userRoles.filter(ur => 
      !organizationId || ur.organizationId === organizationId
    )
  }

  /**
   * Get all permissions
   */
  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values())
  }

  /**
   * Get all roles
   */
  public getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  /**
   * Create custom role
   */
  public async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const newRole: Role = {
      ...role,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.roles.set(newRole.id, newRole)

    logger.info('Custom role created', {
      roleId: newRole.id,
      name: newRole.name,
      permissions: newRole.permissions.length,
    })

    return newRole
  }
}

export default RBACService
