import React from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  title: string
  description?: string
  duration?: number
  action?: React.ReactNode
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'default',
  title,
  description,
  onClose,
  action
}) => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={cn(
      'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
      variants[variant]
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}