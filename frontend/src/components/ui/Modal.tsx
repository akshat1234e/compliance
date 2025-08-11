/**
 * Modal Component
 * Accessible modal dialog with various sizes and configurations
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const modalVariants = cva(
  'relative bg-white rounded-lg shadow-xl',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        full: 'max-w-full mx-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    className,
    size,
    open,
    onClose,
    title,
    description,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    ...props
  }, ref) => {
    const modalRef = React.useRef<HTMLDivElement>(null)

    // Handle escape key
    React.useEffect(() => {
      if (!closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && open) {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, onClose, closeOnEscape])

    // Handle focus trap
    React.useEffect(() => {
      if (!open) return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            event.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus()
            event.preventDefault()
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      firstElement?.focus()

      return () => document.removeEventListener('keydown', handleTabKey)
    }, [open])

    // Handle body scroll lock
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [open])

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(modalVariants({ size, className }), 'relative z-10 w-full')}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export { Modal, modalVariants }

// Modal Components
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
))
ModalHeader.displayName = 'ModalHeader'

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
ModalTitle.displayName = 'ModalTitle'

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))
ModalDescription.displayName = 'ModalDescription'

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
ModalContent.displayName = 'ModalContent'

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
))
ModalFooter.displayName = 'ModalFooter'

export { ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter }

// Confirmation Modal Component
export interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export const ConfirmationModal = React.forwardRef<HTMLDivElement, ConfirmationModalProps>(
  ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    loading = false,
  }, ref) => {
    return (
      <Modal
        ref={ref}
        open={open}
        onClose={onClose}
        size="sm"
        title={title}
        description={description}
      >
        <ModalFooter className="mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'w-full sm:w-auto px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50',
              variant === 'destructive'
                ? 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
                : 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </ModalFooter>
      </Modal>
    )
  }
)

ConfirmationModal.displayName = 'ConfirmationModal'

// Form Modal Component
export interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl' | 'full'
}

export const FormModal = React.forwardRef<HTMLDivElement, FormModalProps>(
  ({ open, onClose, title, description, children, footer, size = 'default' }, ref) => {
    return (
      <Modal
        ref={ref}
        open={open}
        onClose={onClose}
        size={size}
        title={title}
        description={description}
      >
        <ModalContent>{children}</ModalContent>
        {footer && <ModalFooter className="mt-6">{footer}</ModalFooter>}
      </Modal>
    )
  }
)

FormModal.displayName = 'FormModal'

// Alert Modal Component
export interface AlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actionText?: string
}

export const AlertModal = React.forwardRef<HTMLDivElement, AlertModalProps>(
  ({
    open,
    onClose,
    title,
    description,
    type = 'info',
    actionText = 'OK',
  }, ref) => {
    const getIcon = () => {
      switch (type) {
        case 'success':
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
              <svg className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )
        case 'warning':
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
              <svg className="h-6 w-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )
        case 'error':
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
              <svg className="h-6 w-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )
        default:
          return (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )
      }
    }

    return (
      <Modal ref={ref} open={open} onClose={onClose} size="sm">
        <div className="text-center">
          {getIcon()}
          <ModalTitle className="mt-4">{title}</ModalTitle>
          <ModalDescription className="mt-2">{description}</ModalDescription>
          <ModalFooter className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              {actionText}
            </button>
          </ModalFooter>
        </div>
      </Modal>
    )
  }
)

AlertModal.displayName = 'AlertModal'
