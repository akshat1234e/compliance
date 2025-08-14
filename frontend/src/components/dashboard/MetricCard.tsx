'use client'

import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: 'compliance' | 'workflows' | 'tasks' | 'risk' | 'analytics'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
  className?: string
}

const iconMap = {
  compliance: ShieldCheckIcon,
  workflows: ChartBarIcon,
  tasks: ClockIcon,
  risk: ExclamationTriangleIcon,
  analytics: ChartBarIcon,
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    border: 'border-gray-200'
  },
  success: {
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    border: 'border-success-200'
  },
  warning: {
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    border: 'border-warning-200'
  },
  danger: {
    iconBg: 'bg-danger-100',
    iconColor: 'text-danger-600',
    border: 'border-danger-200'
  }
}

export default function MetricCard({
  title,
  value,
  change,
  icon = 'compliance',
  variant = 'default',
  loading = false,
  className = ''
}: MetricCardProps) {
  const Icon = iconMap[icon]
  const styles = variantStyles[variant]

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${styles.border} p-6 shadow-sm hover:shadow-medium transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          
          {/* Value */}
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {/* Change Indicator */}
          {change && (
            <div className="flex items-center">
              <div className={`flex items-center text-sm font-medium ${
                change.type === 'increase' 
                  ? change.value > 0 ? 'text-success-600' : 'text-danger-600'
                  : change.value > 0 ? 'text-danger-600' : 'text-success-600'
              }`}>
                {change.type === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change.value)}%
              </div>
              <span className="text-sm text-gray-500 ml-2">
                vs {change.period}
              </span>
            </div>
          )}
        </div>
        
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  )
}

// Predefined metric card variants for common use cases
export function ComplianceScoreCard({ score, change, loading }: { 
  score: number
  change?: MetricCardProps['change']
  loading?: boolean 
}) {
  const variant = score >= 90 ? 'success' : score >= 70 ? 'warning' : 'danger'
  
  return (
    <MetricCard
      title="Compliance Score"
      value={`${score}%`}
      change={change}
      icon="compliance"
      variant={variant}
      loading={loading}
    />
  )
}

export function ActiveWorkflowsCard({ count, change, loading }: { 
  count: number
  change?: MetricCardProps['change']
  loading?: boolean 
}) {
  return (
    <MetricCard
      title="Active Workflows"
      value={count}
      change={change}
      icon="workflows"
      variant="default"
      loading={loading}
    />
  )
}

export function PendingTasksCard({ count, change, loading }: { 
  count: number
  change?: MetricCardProps['change']
  loading?: boolean 
}) {
  const variant = count > 10 ? 'warning' : count > 20 ? 'danger' : 'default'
  
  return (
    <MetricCard
      title="Pending Tasks"
      value={count}
      change={change}
      icon="tasks"
      variant={variant}
      loading={loading}
    />
  )
}

export function RiskLevelCard({ level, score, change, loading }: { 
  level: 'Low' | 'Medium' | 'High' | 'Critical'
  score?: number
  change?: MetricCardProps['change']
  loading?: boolean 
}) {
  const variantMap = {
    'Low': 'success',
    'Medium': 'warning', 
    'High': 'danger',
    'Critical': 'danger'
  } as const
  
  return (
    <MetricCard
      title="Risk Level"
      value={score ? `${level} (${score}%)` : level}
      change={change}
      icon="risk"
      variant={variantMap[level]}
      loading={loading}
    />
  )
}

// Metric cards grid container
export function MetricCardsGrid({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  )
}
