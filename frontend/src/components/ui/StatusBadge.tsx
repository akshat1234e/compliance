'use client'

import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export type StatusType = 
  | 'compliant' 
  | 'non-compliant' 
  | 'partially-compliant' 
  | 'pending' 
  | 'overdue'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

interface StatusBadgeProps {
  status: StatusType
  text?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  // Compliance statuses
  compliant: {
    colors: 'bg-success-100 text-success-800 border-success-200',
    icon: CheckCircleIcon,
    defaultText: 'Compliant'
  },
  'non-compliant': {
    colors: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: XCircleIcon,
    defaultText: 'Non-Compliant'
  },
  'partially-compliant': {
    colors: 'bg-warning-100 text-warning-800 border-warning-200',
    icon: ExclamationTriangleIcon,
    defaultText: 'Partially Compliant'
  },
  pending: {
    colors: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ClockIcon,
    defaultText: 'Pending'
  },
  overdue: {
    colors: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: ExclamationTriangleIcon,
    defaultText: 'Overdue'
  },
  
  // General statuses
  success: {
    colors: 'bg-success-100 text-success-800 border-success-200',
    icon: CheckCircleIcon,
    defaultText: 'Success'
  },
  warning: {
    colors: 'bg-warning-100 text-warning-800 border-warning-200',
    icon: ExclamationTriangleIcon,
    defaultText: 'Warning'
  },
  error: {
    colors: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: XCircleIcon,
    defaultText: 'Error'
  },
  info: {
    colors: 'bg-info-100 text-info-800 border-info-200',
    icon: ClockIcon,
    defaultText: 'Info'
  },
  
  // Risk levels
  low: {
    colors: 'bg-success-100 text-success-800 border-success-200',
    icon: CheckCircleIcon,
    defaultText: 'Low Risk'
  },
  medium: {
    colors: 'bg-warning-100 text-warning-800 border-warning-200',
    icon: ExclamationTriangleIcon,
    defaultText: 'Medium Risk'
  },
  high: {
    colors: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: ExclamationTriangleIcon,
    defaultText: 'High Risk'
  },
  critical: {
    colors: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: XCircleIcon,
    defaultText: 'Critical Risk'
  }
}

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    padding: 'px-2.5 py-0.5',
    text: 'text-xs',
    icon: 'h-4 w-4'
  },
  lg: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    icon: 'h-4 w-4'
  }
}

export default function StatusBadge({
  status,
  text,
  size = 'md',
  showIcon = true,
  className = ''
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  const displayText = text || config.defaultText

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${config.colors}
      ${sizeStyles.padding}
      ${sizeStyles.text}
      ${className}
    `}>
      {showIcon && (
        <Icon className={`${sizeStyles.icon} mr-1`} />
      )}
      {displayText}
    </span>
  )
}

// Predefined badge components for common use cases
export function ComplianceBadge({ 
  status, 
  text, 
  size = 'md' 
}: { 
  status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'pending' | 'overdue'
  text?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return <StatusBadge status={status} text={text} size={size} />
}

export function RiskBadge({ 
  level, 
  text, 
  size = 'md' 
}: { 
  level: 'low' | 'medium' | 'high' | 'critical'
  text?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return <StatusBadge status={level} text={text} size={size} />
}

export function PriorityBadge({ 
  priority, 
  text, 
  size = 'md' 
}: { 
  priority: 'low' | 'medium' | 'high' | 'critical'
  text?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const priorityText = text || `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`
  return <StatusBadge status={priority} text={priorityText} size={size} />
}

// Progress badge for workflow completion
export function ProgressBadge({ 
  percentage, 
  size = 'md' 
}: { 
  percentage: number
  size?: 'sm' | 'md' | 'lg'
}) {
  let status: StatusType = 'pending'
  
  if (percentage >= 100) {
    status = 'success'
  } else if (percentage >= 75) {
    status = 'info'
  } else if (percentage >= 50) {
    status = 'warning'
  } else if (percentage >= 25) {
    status = 'warning'
  }
  
  return (
    <StatusBadge 
      status={status} 
      text={`${percentage}%`} 
      size={size} 
      showIcon={false}
    />
  )
}
