'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAppSelector } from '@/store'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'

interface AssistantInsight {
  id: string
  type: 'alert' | 'suggestion' | 'prediction' | 'optimization' | 'guidance'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    handler: () => void
  }
  metadata?: {
    confidence: number
    deadline?: string
    impact: 'high' | 'medium' | 'low'
    category: string
  }
}

interface SmartComplianceAssistantProps {
  position?: 'sidebar' | 'panel' | 'modal'
  showPredictions?: boolean
  showOptimizations?: boolean
  showGuidance?: boolean
  className?: string
}

export default function SmartComplianceAssistant({
  position = 'panel',
  showPredictions = true,
  showOptimizations = true,
  showGuidance = true,
  className = ''
}: SmartComplianceAssistantProps) {
  const [insights, setInsights] = useState<AssistantInsight[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeInsight, setActiveInsight] = useState<string | null>(null)
  
  const { userContext, predictiveIntelligence, systemIntelligence } = useAppSelector(
    state => state.intelligence
  )
  const { navigateWithContext, getContextualActions } = useSmartNavigation()

  // Generate AI insights based on current context
  const generateInsights = useCallback(() => {
    const newInsights: AssistantInsight[] = []

    // High priority alerts from system intelligence
    systemIntelligence.pendingNotifications
      .filter(notif => notif.priority === 'high' && !notif.read)
      .forEach(notif => {
        newInsights.push({
          id: `alert_${notif.id}`,
          type: 'alert',
          priority: 'high',
          title: notif.title,
          description: notif.message,
          action: notif.suggestedActions?.[0] ? {
            label: notif.suggestedActions[0],
            handler: () => {
              // Handle suggested action
              if (notif.type === 'regulation') {
                navigateWithContext('/dashboard/regulatory')
              } else if (notif.type === 'workflow') {
                navigateWithContext('/dashboard/compliance')
              }
            }
          } : undefined,
          metadata: {
            confidence: 0.95,
            impact: 'high',
            category: notif.type
          }
        })
      })

    // Predictive suggestions
    if (showPredictions) {
      predictiveIntelligence.recommendedActions.forEach(action => {
        newInsights.push({
          id: `prediction_${action.action}`,
          type: 'prediction',
          priority: action.urgency === 'immediate' ? 'high' : 'medium',
          title: `Predicted Action: ${action.action.replace('_', ' ').toUpperCase()}`,
          description: action.description,
          action: {
            label: 'Take Action',
            handler: () => {
              const contextualActions = getContextualActions()
              const matchingAction = contextualActions.find(ca => ca.action === action.action)
              if (matchingAction?.path) {
                navigateWithContext(matchingAction.path)
              } else if (matchingAction?.handler) {
                matchingAction.handler()
              }
            }
          },
          metadata: {
            confidence: action.confidence,
            impact: action.urgency === 'immediate' ? 'high' : 'medium',
            category: 'prediction'
          }
        })
      })
    }

    // Context-based guidance
    if (showGuidance) {
      const currentPage = userContext.currentPage
      
      if (currentPage.includes('/regulatory')) {
        newInsights.push({
          id: 'guidance_regulatory',
          type: 'guidance',
          priority: 'medium',
          title: 'Regulatory Analysis Guidance',
          description: 'Review impact assessment and create workflows for new regulations',
          action: {
            label: 'Start Analysis',
            handler: () => navigateWithContext('/dashboard/compliance/create')
          },
          metadata: {
            confidence: 0.8,
            impact: 'medium',
            category: 'guidance'
          }
        })
      }

      if (currentPage.includes('/compliance')) {
        newInsights.push({
          id: 'guidance_compliance',
          type: 'guidance',
          priority: 'medium',
          title: 'Workflow Optimization',
          description: 'Consider automating repetitive compliance tasks',
          action: {
            label: 'View Automation Options',
            handler: () => navigateWithContext('/dashboard/integrations')
          },
          metadata: {
            confidence: 0.75,
            impact: 'medium',
            category: 'optimization'
          }
        })
      }
    }

    // Performance optimizations
    if (showOptimizations) {
      newInsights.push({
        id: 'optimization_deadlines',
        type: 'optimization',
        priority: 'low',
        title: 'Deadline Management',
        description: 'Set up automated reminders for upcoming compliance deadlines',
        action: {
          label: 'Configure Reminders',
          handler: () => navigateWithContext('/settings/notifications')
        },
        metadata: {
          confidence: 0.7,
          impact: 'low',
          category: 'optimization'
        }
      })
    }

    // Sort by priority and confidence
    const sortedInsights = newInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return (b.metadata?.confidence || 0) - (a.metadata?.confidence || 0)
    })

    setInsights(sortedInsights.slice(0, 6)) // Limit to top 6 insights
  }, [
    systemIntelligence.pendingNotifications,
    predictiveIntelligence.recommendedActions,
    userContext.currentPage,
    showPredictions,
    showGuidance,
    showOptimizations,
    navigateWithContext,
    getContextualActions
  ])

  useEffect(() => {
    generateInsights()
    
    // Refresh insights every 30 seconds
    const interval = setInterval(generateInsights, 30000)
    return () => clearInterval(interval)
  }, [generateInsights])

  const getInsightIcon = (type: AssistantInsight['type']) => {
    switch (type) {
      case 'alert':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'suggestion':
        return <LightBulbIcon className="h-5 w-5" />
      case 'prediction':
        return <SparklesIcon className="h-5 w-5" />
      case 'optimization':
        return <ChartBarIcon className="h-5 w-5" />
      case 'guidance':
        return <DocumentTextIcon className="h-5 w-5" />
      default:
        return <CheckCircleIcon className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: AssistantInsight['type'], priority: AssistantInsight['priority']) => {
    if (priority === 'high') {
      return 'text-danger-600 bg-danger-50 border-danger-200'
    }
    
    switch (type) {
      case 'alert':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'suggestion':
        return 'text-info-600 bg-info-50 border-info-200'
      case 'prediction':
        return 'text-primary-600 bg-primary-50 border-primary-200'
      case 'optimization':
        return 'text-success-600 bg-success-50 border-success-200'
      case 'guidance':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (insights.length === 0) {
    return null
  }

  const containerClasses = {
    sidebar: 'w-80 h-full bg-white border-l border-gray-200',
    panel: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    modal: 'fixed inset-0 z-50 bg-white'
  }

  return (
    <div className={`${containerClasses[position]} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {insights.length} insights
          </span>
        </div>
        {position !== 'modal' && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? (
              <XMarkIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Insights List */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type, insight.priority)} transition-all duration-200 hover:shadow-sm cursor-pointer`}
              onClick={() => setActiveInsight(activeInsight === insight.id ? null : insight.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    {insight.metadata?.confidence && (
                      <span className="text-xs text-gray-500 ml-2">
                        {Math.round(insight.metadata.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {insight.description}
                  </p>
                  
                  {/* Expanded Details */}
                  {activeInsight === insight.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {insight.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <span>Impact: {insight.metadata.impact}</span>
                          <span>Category: {insight.metadata.category}</span>
                          {insight.metadata.deadline && (
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {insight.metadata.deadline}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {insight.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            insight.action!.handler()
                          }}
                          className="w-full px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          {insight.action.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => navigateWithContext('/dashboard/ai-insights')}
            className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All AI Insights
          </button>
        </div>
      )}
    </div>
  )
}
