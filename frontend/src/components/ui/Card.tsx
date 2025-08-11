/**
 * Card Component
 * Flexible card component for displaying content with various layouts
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        elevated: 'bg-white border-gray-200 shadow-md',
        outlined: 'bg-white border-2 border-gray-300',
        filled: 'bg-gray-50 border-gray-200',
        success: 'bg-success-50 border-success-200',
        warning: 'bg-warning-50 border-warning-200',
        error: 'bg-error-50 border-error-200',
        info: 'bg-brand-50 border-brand-200',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive, className }))}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

// Specialized Card Components

// Stat Card Component
export interface StatCardProps extends Omit<CardProps, 'children'> {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period?: string
  }
  icon?: React.ReactNode
  description?: string
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, change, icon, description, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('', className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
            {icon && (
              <div className="flex-shrink-0 ml-4">
                <div className="w-8 h-8 text-gray-400">{icon}</div>
              </div>
            )}
          </div>
          {change && (
            <div className="mt-4 flex items-center">
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-success-600' : 'text-error-600'
                )}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              {change.period && (
                <span className="text-sm text-gray-500 ml-2">
                  from {change.period}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = 'StatCard'

// Metric Card Component
export interface MetricCardProps extends Omit<CardProps, 'children'> {
  title: string
  metrics: Array<{
    label: string
    value: string | number
    color?: string
  }>
  footer?: React.ReactNode
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, metrics, footer, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('', className)} {...props}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    metric.color || 'text-gray-900'
                  )}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    )
  }
)
MetricCard.displayName = 'MetricCard'

// Alert Card Component
export interface AlertCardProps extends Omit<CardProps, 'children' | 'variant'> {
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  action?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

export const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({ title, description, type, action, dismissible, onDismiss, className, ...props }, ref) => {
    const getVariant = () => {
      switch (type) {
        case 'success': return 'success'
        case 'warning': return 'warning'
        case 'error': return 'error'
        default: return 'info'
      }
    }

    const getIcon = () => {
      switch (type) {
        case 'success':
          return (
            <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        case 'warning':
          return (
            <svg className="w-5 h-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        case 'error':
          return (
            <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        default:
          return (
            <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
      }
    }

    return (
      <Card ref={ref} variant={getVariant()} className={cn('', className)} {...props}>
        <CardContent className="p-4">
          <div className="flex">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium">{title}</h3>
              <p className="text-sm mt-1 opacity-90">{description}</p>
              {action && <div className="mt-3">{action}</div>}
            </div>
            {dismissible && (
              <div className="ml-auto pl-3">
                <button
                  onClick={onDismiss}
                  className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
AlertCard.displayName = 'AlertCard'
