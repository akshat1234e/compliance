/**
 * Minimal UI Components for Workflow Management
 * Basic implementations to resolve import errors
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Basic Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    />
  );
};

// Basic Card Components
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm', className)} {...props} />
);

export const CardHeader: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

export const CardContent: React.FC<CardProps> = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

// Basic Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

// Basic Badge Component
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
    success: 'bg-green-100 text-green-800'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// Basic Modal Component
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Basic Loading Spinner
export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600', className)} />
);

// Basic Table Components
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  ...props
}) => (
  <table className={cn('w-full border-collapse', className)} {...props} />
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead className={cn('bg-gray-50', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody className={cn('divide-y divide-gray-200', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr className={cn('hover:bg-gray-50', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th className={cn('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)} {...props} />
);

// Export all components
export * from './Button';
export * from './Card';
export * from './Input';
export * from './Badge';
export * from './Modal';
export * from './Loading';
export * from './Table';
