import React from 'react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-md w-full',
          className
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}