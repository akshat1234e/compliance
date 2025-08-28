'use client'

import { ArrowPathIcon, ExclamationTriangleIcon, SparklesIcon, WifiIcon } from '@heroicons/react/24/outline'
import React from 'react'

// Page Loading Spinner
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600" />
        </div>
        <p className="mt-4 text-lg font-medium text-gray-900">{message}</p>
        <p className="mt-2 text-sm text-gray-600">Please wait while we load your content</p>
      </div>
    </div>
  )
}

// Component Loading Spinner
export function ComponentLoader({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg', message?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto`}></div>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  )
}

// Skeleton Loading Components
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="mt-4">
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonTable rows={5} columns={3} />
        <SkeletonTable rows={5} columns={3} />
      </div>
    </div>
  )
}

// Button Loading State
export function LoadingButton({
  loading,
  children,
  className = '',
  ...props
}: {
  loading: boolean
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`relative ${className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  )
}

// Inline Loading Indicator
export function InlineLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
      <span>{message}</span>
    </div>
  )
}

// Progress Bar
export function ProgressBar({
  progress,
  className = '',
  showPercentage = true
}: {
  progress: number
  className?: string
  showPercentage?: boolean
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  )
}

// Pulse Animation for any element
export function PulseWrapper({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  )
}

// Error State Components
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
  isOffline?: boolean
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content.',
  onRetry,
  showRetry = true,
  isOffline = false
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400">
        {isOffline ? (
          <WifiIcon className="h-12 w-12" />
        ) : (
          <ExclamationTriangleIcon className="h-12 w-12" />
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {showRetry && onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
}

export function EmptyState({
  title = 'No data available',
  message = 'There is no data to display at the moment.',
  action,
  icon: Icon
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto h-12 w-12 text-gray-400">
          <Icon className="h-12 w-12" />
        </div>
      )}
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

interface FallbackNoticeProps {
  message?: string
  onRetryPrimary?: () => void
}

export function FallbackNotice({
  message = 'Using offline data. Some information may not be up to date.',
  onRetryPrimary
}: FallbackNoticeProps) {
  return (
    <div className="rounded-md bg-yellow-50 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <WifiIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">{message}</p>
          {onRetryPrimary && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onRetryPrimary}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
              >
                Try to reconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
