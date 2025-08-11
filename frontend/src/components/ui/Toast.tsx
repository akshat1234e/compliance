/**
 * Toast Component
 * Notification toast system with various types and positions
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toastVariants = cva(
  'relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white text-gray-900',
        success: 'border-success-200 bg-success-50 text-success-900',
        warning: 'border-warning-200 bg-warning-50 text-warning-900',
        error: 'border-error-200 bg-error-50 text-error-900',
        info: 'border-brand-200 bg-brand-50 text-brand-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  duration?: number
  closable?: boolean
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    variant, 
    title, 
    description, 
    action, 
    onClose, 
    duration = 5000,
    closable = true,
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300) // Allow fade out animation
        }, duration)

        return () => clearTimeout(timer)
      }
    }, [duration, onClose])

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return (
            <svg className="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        case 'warning':
          return (
            <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        case 'error':
          return (
            <svg className="h-5 w-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        case 'info':
          return (
            <svg className="h-5 w-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        default:
          return null
      }
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant }),
          'animate-fade-in',
          !isVisible && 'animate-fade-out',
          className
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-medium">{title}</p>
            )}
            {description && (
              <p className={cn('text-sm', title && 'mt-1', 'opacity-90')}>
                {description}
              </p>
            )}
            {children}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {action}
          {closable && (
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }
)

Toast.displayName = 'Toast'

export { Toast, toastVariants }

// Toast Container Component
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  children: React.ReactNode
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  position = 'top-right', 
  children 
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 w-full max-w-sm',
        positionClasses[position]
      )}
    >
      {children}
    </div>
  )
}

// Toast Hook for managing toasts
export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  duration?: number
  action?: React.ReactNode
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const addToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const toast = React.useMemo(() => ({
    success: (title: string, description?: string, options?: Partial<ToastItem>) =>
      addToast({ title, description, variant: 'success', ...options }),
    
    error: (title: string, description?: string, options?: Partial<ToastItem>) =>
      addToast({ title, description, variant: 'error', ...options }),
    
    warning: (title: string, description?: string, options?: Partial<ToastItem>) =>
      addToast({ title, description, variant: 'warning', ...options }),
    
    info: (title: string, description?: string, options?: Partial<ToastItem>) =>
      addToast({ title, description, variant: 'info', ...options }),
    
    default: (title: string, description?: string, options?: Partial<ToastItem>) =>
      addToast({ title, description, variant: 'default', ...options }),
  }), [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast,
  }
}

// Toast Provider Component
export interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastContainerProps['position']
}

const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(null)

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const toastMethods = useToast()

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer position={position}>
        {toastMethods.toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            duration={toast.duration}
            action={toast.action}
            onClose={() => toastMethods.removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

// Hook to use toast context
export const useToastContext = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

// Simple toast functions for quick use
export const showToast = {
  success: (title: string, description?: string) => {
    // This would need to be connected to a global toast system
    console.log('Success toast:', title, description)
  },
  error: (title: string, description?: string) => {
    console.log('Error toast:', title, description)
  },
  warning: (title: string, description?: string) => {
    console.log('Warning toast:', title, description)
  },
  info: (title: string, description?: string) => {
    console.log('Info toast:', title, description)
  },
}
