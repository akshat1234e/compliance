/**
 * Input Component
 * Comprehensive input component with various types and states
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:ring-brand-500',
        error: 'border-error-300 focus-visible:ring-error-500',
        success: 'border-success-300 focus-visible:ring-success-500',
        warning: 'border-warning-300 focus-visible:ring-warning-500',
      },
      size: {
        default: 'h-10 px-3 py-2',
        sm: 'h-8 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  helperText?: string
  label?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type = 'text',
    leftIcon,
    rightIcon,
    error,
    helperText,
    label,
    required,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const finalVariant = hasError ? 'error' : variant

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 text-gray-400">{leftIcon}</div>
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: finalVariant, size, className }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-xs',
              hasError ? 'text-error-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  error?: string
  helperText?: string
  label?: string
  required?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size,
    error,
    helperText,
    label,
    required,
    resize = 'vertical',
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const finalVariant = hasError ? 'error' : variant

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            inputVariants({ variant: finalVariant, size }),
            'min-h-[80px]',
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            resize === 'both' && 'resize',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-xs',
              hasError ? 'text-error-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void
  onClear?: () => void
  showClearButton?: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    onSearch, 
    onClear, 
    showClearButton = true,
    value,
    onChange,
    className,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onChange?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(internalValue)
      }
    }

    const handleClear = () => {
      setInternalValue('')
      onClear?.()
    }

    const searchIcon = (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )

    const clearIcon = showClearButton && internalValue && (
      <button
        type="button"
        onClick={handleClear}
        className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={searchIcon}
        rightIcon={clearIcon}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

// Password Input Component
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const toggleIcon = showToggle && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        {showPassword ? (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    )

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={toggleIcon}
        className={className}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

// Number Input Component
export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  showControls?: boolean
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    min, 
    max, 
    step = 1, 
    showControls = true,
    value,
    onChange,
    className,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '')

    const handleIncrement = () => {
      const currentValue = Number(internalValue) || 0
      const newValue = Math.min(currentValue + step, max || Infinity)
      setInternalValue(newValue.toString())
      onChange?.({ target: { value: newValue.toString() } } as any)
    }

    const handleDecrement = () => {
      const currentValue = Number(internalValue) || 0
      const newValue = Math.max(currentValue - step, min || -Infinity)
      setInternalValue(newValue.toString())
      onChange?.({ target: { value: newValue.toString() } } as any)
    }

    const controls = showControls && (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={handleIncrement}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          ▼
        </button>
      </div>
    )

    return (
      <Input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value)
          onChange?.(e)
        }}
        rightIcon={controls}
        className={className}
        {...props}
      />
    )
  }
)

NumberInput.displayName = 'NumberInput'
