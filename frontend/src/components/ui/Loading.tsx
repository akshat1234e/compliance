/**
 * Loading Component
 * Various loading states and spinners
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const loadingVariants = cva(
  'inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-2',
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'text-brand-600',
        white: 'text-white',
        gray: 'text-gray-400',
        success: 'text-success-600',
        warning: 'text-warning-600',
        error: 'text-error-600',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(loadingVariants({ size, variant, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
)

LoadingSpinner.displayName = 'LoadingSpinner'

export { LoadingSpinner, loadingVariants }

// Loading Dots Component
export interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'white' | 'gray'
}

export const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = 'default', variant = 'default', ...props }, ref) => {
    const dotSize = {
      sm: 'w-1 h-1',
      default: 'w-2 h-2',
      lg: 'w-3 h-3',
    }

    const dotColor = {
      default: 'bg-brand-600',
      white: 'bg-white',
      gray: 'bg-gray-400',
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center space-x-1', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div
          className={cn(
            'rounded-full animate-bounce',
            dotSize[size],
            dotColor[variant]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'rounded-full animate-bounce',
            dotSize[size],
            dotColor[variant]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'rounded-full animate-bounce',
            dotSize[size],
            dotColor[variant]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    )
  }
)

LoadingDots.displayName = 'LoadingDots'

// Loading Pulse Component
export interface LoadingPulseProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  className?: string
}

export const LoadingPulse = React.forwardRef<HTMLDivElement, LoadingPulseProps>(
  ({ lines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('animate-pulse space-y-3', className)}
        role="status"
        aria-label="Loading content"
        {...props}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }
)

LoadingPulse.displayName = 'LoadingPulse'

// Loading Skeleton Component
export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  circle?: boolean
  lines?: number
}

export const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ width, height, circle = false, lines = 1, className, ...props }, ref) => {
    const skeletonStyle = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }

    if (lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('animate-pulse space-y-2', className)}
          role="status"
          aria-label="Loading content"
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-200 rounded"
              style={{
                width: index === lines - 1 ? '75%' : '100%',
              }}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-gray-200',
          circle ? 'rounded-full' : 'rounded',
          !width && !height && 'h-4 w-full',
          className
        )}
        style={skeletonStyle}
        role="status"
        aria-label="Loading content"
        {...props}
      />
    )
  }
)

LoadingSkeleton.displayName = 'LoadingSkeleton'

// Loading Overlay Component
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible: boolean
  text?: string
  size?: 'sm' | 'default' | 'lg'
  backdrop?: boolean
}

export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    visible, 
    text = 'Loading...', 
    size = 'default', 
    backdrop = true,
    className, 
    children,
    ...props 
  }, ref) => {
    if (!visible) return <>{children}</>

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            backdrop && 'bg-white/80 backdrop-blur-sm'
          )}
        >
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size={size} />
            {text && (
              <p className="text-sm text-gray-600 font-medium">{text}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

LoadingOverlay.displayName = 'LoadingOverlay'

// Loading Button Component
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    loading = false,
    loadingText,
    size = 'default',
    variant = 'default',
    leftIcon,
    rightIcon,
    children,
    disabled,
    className,
    ...props 
  }, ref) => {
    const buttonSizes = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    const buttonVariants = {
      default: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    }

    const spinnerSize = {
      sm: 'xs',
      default: 'sm',
      lg: 'default',
    } as const

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          buttonSizes[size],
          buttonVariants[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <LoadingSpinner 
            size={spinnerSize[size]} 
            variant={variant === 'default' ? 'white' : 'default'} 
          />
        )}
        {!loading && leftIcon && leftIcon}
        {loading ? (loadingText || 'Loading...') : children}
        {!loading && rightIcon && rightIcon}
      </button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

// Page Loading Component
export interface PageLoadingProps {
  text?: string
  fullScreen?: boolean
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-4',
        fullScreen ? 'fixed inset-0 bg-white z-50' : 'py-12'
      )}
    >
      <LoadingSpinner size="xl" />
      <p className="text-lg text-gray-600 font-medium">{text}</p>
    </div>
  )
}

PageLoading.displayName = 'PageLoading'

// Table Loading Component
export const TableLoading: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-3/4" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

TableLoading.displayName = 'TableLoading'
