/**
 * Badge Component
 * Versatile badge component for status indicators, labels, and notifications
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'border-transparent bg-error-600 text-white hover:bg-error-700',
        outline: 'border-gray-300 text-gray-900 hover:bg-gray-50',
        success: 'border-transparent bg-success-600 text-white hover:bg-success-700',
        warning: 'border-transparent bg-warning-600 text-white hover:bg-warning-700',
        info: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
        
        // Compliance status variants
        compliant: 'border-transparent bg-success-100 text-success-800',
        'non-compliant': 'border-transparent bg-error-100 text-error-800',
        'partially-compliant': 'border-transparent bg-warning-100 text-warning-800',
        pending: 'border-transparent bg-gray-100 text-gray-800',
        overdue: 'border-transparent bg-error-200 text-error-900',
        
        // Risk level variants
        'risk-low': 'border-transparent bg-success-100 text-success-800',
        'risk-medium': 'border-transparent bg-warning-100 text-warning-800',
        'risk-high': 'border-transparent bg-error-100 text-error-800',
        'risk-critical': 'border-transparent bg-error-200 text-error-900',
        
        // Priority variants
        'priority-urgent': 'border-transparent bg-error-200 text-error-900',
        'priority-high': 'border-transparent bg-orange-100 text-orange-800',
        'priority-medium': 'border-transparent bg-warning-100 text-warning-800',
        'priority-low': 'border-transparent bg-success-100 text-success-800',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      dot: {
        true: 'pl-1.5',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      dot: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, icon, removable, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot, className }))}
        {...props}
      >
        {dot && (
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
        )}
        {icon && <div className="w-3 h-3">{icon}</div>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-current"
          >
            <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
              <path d="m0 0 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }

// Specialized Badge Components

// Status Badge Component
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'cancelled'
}

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const getVariant = () => {
      switch (status) {
        case 'active':
        case 'completed':
          return 'success'
        case 'pending':
          return 'warning'
        case 'failed':
        case 'cancelled':
          return 'destructive'
        case 'inactive':
          return 'secondary'
        default:
          return 'default'
      }
    }

    return (
      <Badge
        ref={ref}
        variant={getVariant()}
        dot
        className={className}
        {...props}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

// Compliance Badge Component
export interface ComplianceBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'pending' | 'overdue'
}

export const ComplianceBadge = React.forwardRef<HTMLDivElement, ComplianceBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const getIcon = () => {
      switch (status) {
        case 'compliant':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        case 'non-compliant':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        case 'partially-compliant':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        case 'overdue':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )
        default:
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )
      }
    }

    const getLabel = () => {
      switch (status) {
        case 'compliant':
          return 'Compliant'
        case 'non-compliant':
          return 'Non-Compliant'
        case 'partially-compliant':
          return 'Partially Compliant'
        case 'pending':
          return 'Pending'
        case 'overdue':
          return 'Overdue'
        default:
          return status
      }
    }

    return (
      <Badge
        ref={ref}
        variant={status}
        icon={getIcon()}
        className={className}
        {...props}
      >
        {getLabel()}
      </Badge>
    )
  }
)

ComplianceBadge.displayName = 'ComplianceBadge'

// Risk Badge Component
export interface RiskBadgeProps extends Omit<BadgeProps, 'variant'> {
  level: 'low' | 'medium' | 'high' | 'critical'
}

export const RiskBadge = React.forwardRef<HTMLDivElement, RiskBadgeProps>(
  ({ level, className, ...props }, ref) => {
    const getIcon = () => {
      switch (level) {
        case 'low':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        case 'medium':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )
        case 'high':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          )
        case 'critical':
          return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        default:
          return null
      }
    }

    return (
      <Badge
        ref={ref}
        variant={`risk-${level}` as any}
        icon={getIcon()}
        className={className}
        {...props}
      >
        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
      </Badge>
    )
  }
)

RiskBadge.displayName = 'RiskBadge'

// Priority Badge Component
export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

export const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant={`priority-${priority}` as any}
        className={className}
        {...props}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    )
  }
)

PriorityBadge.displayName = 'PriorityBadge'

// Count Badge Component
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  showZero?: boolean
}

export const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, className, ...props }, ref) => {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count.toString()

    return (
      <Badge
        ref={ref}
        variant="destructive"
        size="sm"
        className={cn('min-w-[1.25rem] h-5 px-1 justify-center', className)}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)

CountBadge.displayName = 'CountBadge'
