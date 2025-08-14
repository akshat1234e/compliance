'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  updateUserContext,
  addNavigationPattern,
  updatePredictions,
  setCrossPageContext
} from '@/store/slices/intelligenceSlice'

interface NavigationContext {
  fromPage?: string
  reason?: string
  preserveContext?: boolean
  contextData?: Record<string, any>
}

interface SmartNavigationHook {
  navigateWithContext: (path: string, context?: NavigationContext) => void
  navigateBack: () => void
  getSuggestedPages: () => Array<{
    page: string
    confidence: number
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
  getContextualActions: () => Array<{
    action: string
    description: string
    path?: string
    handler?: () => void
  }>
  setPageContext: (key: string, value: any) => void
  getPageContext: (key: string) => any
  predictNextAction: () => string | null
}

export function useSmartNavigation(): SmartNavigationHook {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  
  const { userContext, predictiveIntelligence, crossPageContext } = useAppSelector(
    state => state.intelligence
  )
  
  const pageStartTime = useRef<number>(Date.now())
  const previousPage = useRef<string>('')

  // Track page changes and learn navigation patterns
  useEffect(() => {
    const currentTime = Date.now()
    
    // Update user context with current page
    dispatch(updateUserContext({
      currentPage: pathname,
      lastActivity: currentTime
    }))
    
    // Learn from navigation pattern if there was a previous page
    if (previousPage.current && previousPage.current !== pathname) {
      const timeSpent = currentTime - pageStartTime.current
      dispatch(addNavigationPattern({
        from: previousPage.current,
        to: pathname,
        timeSpent
      }))
    }
    
    // Update predictions based on new context
    dispatch(updatePredictions({ currentPage: pathname }))
    
    // Reset tracking for new page
    pageStartTime.current = currentTime
    previousPage.current = pathname
  }, [pathname, dispatch])

  // Smart navigation with context preservation
  const navigateWithContext = useCallback((
    path: string, 
    context?: NavigationContext
  ) => {
    const currentTime = Date.now()
    
    // Preserve context if requested
    if (context?.preserveContext && context?.contextData) {
      Object.entries(context.contextData).forEach(([key, value]) => {
        dispatch(setCrossPageContext({ key, value }))
      })
    }
    
    // Learn from this navigation
    const timeSpent = currentTime - pageStartTime.current
    dispatch(addNavigationPattern({
      from: pathname,
      to: path,
      timeSpent
    }))
    
    // Navigate to new page
    router.push(path)
  }, [router, pathname, dispatch])

  // Intelligent back navigation
  const navigateBack = useCallback(() => {
    // Use browser history or intelligent fallback
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to dashboard if no history
      navigateWithContext('/dashboard')
    }
  }, [router, navigateWithContext])

  // Get AI-suggested next pages
  const getSuggestedPages = useCallback(() => {
    return predictiveIntelligence.suggestedNextPages.filter(
      suggestion => suggestion.page !== pathname
    )
  }, [predictiveIntelligence.suggestedNextPages, pathname])

  // Get contextual actions based on current page and user context
  const getContextualActions = useCallback(() => {
    const actions: Array<{
      action: string
      description: string
      path?: string
      handler?: () => void
    }> = []

    // Add recommended actions from AI
    predictiveIntelligence.recommendedActions.forEach(action => {
      switch (action.action) {
        case 'review_regulation':
          actions.push({
            action: action.action,
            description: action.description,
            path: '/dashboard/regulatory'
          })
          break
        case 'complete_workflow':
          actions.push({
            action: action.action,
            description: action.description,
            path: '/dashboard/compliance'
          })
          break
        case 'assess_risk':
          actions.push({
            action: action.action,
            description: action.description,
            path: '/dashboard/risk'
          })
          break
        default:
          actions.push({
            action: action.action,
            description: action.description
          })
      }
    })

    // Add context-specific actions based on current page
    switch (pathname) {
      case '/dashboard':
        actions.push({
          action: 'create_workflow',
          description: 'Create new compliance workflow',
          path: '/dashboard/compliance/create'
        })
        break
      case '/dashboard/regulatory':
        actions.push({
          action: 'analyze_impact',
          description: 'Analyze regulation impact',
          handler: () => {
            dispatch(setCrossPageContext({
              key: 'analysis_mode',
              value: true
            }))
            navigateWithContext('/dashboard/compliance')
          }
        })
        break
      case '/dashboard/compliance':
        actions.push({
          action: 'generate_report',
          description: 'Generate compliance report',
          path: '/dashboard/analytics'
        })
        break
    }

    return actions
  }, [predictiveIntelligence.recommendedActions, pathname, dispatch, navigateWithContext])

  // Set context data for cross-page sharing
  const setPageContext = useCallback((key: string, value: any) => {
    dispatch(setCrossPageContext({ key, value }))
  }, [dispatch])

  // Get context data from cross-page sharing
  const getPageContext = useCallback((key: string) => {
    return crossPageContext[key]
  }, [crossPageContext])

  // Predict next likely action based on AI learning
  const predictNextAction = useCallback((): string | null => {
    const suggestions = getSuggestedPages()
    if (suggestions.length > 0) {
      const highConfidenceSuggestion = suggestions.find(s => s.confidence > 0.8)
      return highConfidenceSuggestion?.page || suggestions[0].page
    }
    return null
  }, [getSuggestedPages])

  return {
    navigateWithContext,
    navigateBack,
    getSuggestedPages,
    getContextualActions,
    setPageContext,
    getPageContext,
    predictNextAction
  }
}

// Hook for page-specific context management
export function usePageContext(pageKey: string) {
  const { setPageContext, getPageContext } = useSmartNavigation()
  
  const setContext = useCallback((data: any) => {
    setPageContext(pageKey, data)
  }, [pageKey, setPageContext])
  
  const getContext = useCallback(() => {
    return getPageContext(pageKey)
  }, [pageKey, getPageContext])
  
  const clearContext = useCallback(() => {
    setPageContext(pageKey, null)
  }, [pageKey, setPageContext])
  
  return { setContext, getContext, clearContext }
}

// Hook for workflow context preservation
export function useWorkflowContext() {
  const { setPageContext, getPageContext } = useSmartNavigation()
  
  const setWorkflowContext = useCallback((workflowId: string, data: any) => {
    setPageContext(`workflow_${workflowId}`, data)
  }, [setPageContext])
  
  const getWorkflowContext = useCallback((workflowId: string) => {
    return getPageContext(`workflow_${workflowId}`)
  }, [getPageContext])
  
  const setActiveWorkflow = useCallback((workflowId: string) => {
    setPageContext('active_workflow', workflowId)
  }, [setPageContext])
  
  const getActiveWorkflow = useCallback(() => {
    return getPageContext('active_workflow')
  }, [getPageContext])
  
  return {
    setWorkflowContext,
    getWorkflowContext,
    setActiveWorkflow,
    getActiveWorkflow
  }
}

// Hook for regulation context preservation
export function useRegulationContext() {
  const { setPageContext, getPageContext } = useSmartNavigation()
  
  const setSelectedRegulation = useCallback((regulationId: string, data?: any) => {
    setPageContext('selected_regulation', { id: regulationId, data })
  }, [setPageContext])
  
  const getSelectedRegulation = useCallback(() => {
    return getPageContext('selected_regulation')
  }, [getPageContext])
  
  const setRegulationAnalysis = useCallback((analysis: any) => {
    setPageContext('regulation_analysis', analysis)
  }, [setPageContext])
  
  const getRegulationAnalysis = useCallback(() => {
    return getPageContext('regulation_analysis')
  }, [getPageContext])
  
  return {
    setSelectedRegulation,
    getSelectedRegulation,
    setRegulationAnalysis,
    getRegulationAnalysis
  }
}
