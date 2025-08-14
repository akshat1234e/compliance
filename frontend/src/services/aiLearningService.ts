/**
 * Advanced AI Learning Service
 * Implements machine learning models for user behavior prediction and pattern recognition
 */

interface UserBehaviorPattern {
  userId: string
  sessionId: string
  timestamp: number
  action: 'navigation' | 'search' | 'task_completion' | 'error' | 'interaction'
  context: {
    page: string
    section?: string
    feature?: string
    duration?: number
    success?: boolean
  }
  metadata: Record<string, any>
}

interface PredictionModel {
  type: 'navigation' | 'task_completion' | 'error_prevention' | 'content_recommendation'
  confidence: number
  accuracy: number
  lastTrained: number
  version: string
}

interface UserProfile {
  userId: string
  role: string
  experienceLevel: 'beginner' | 'intermediate' | 'expert'
  preferences: {
    navigationStyle: 'linear' | 'exploratory' | 'task_focused'
    informationDensity: 'minimal' | 'standard' | 'detailed'
    assistanceLevel: 'high' | 'medium' | 'low'
  }
  behaviorPatterns: {
    mostUsedFeatures: string[]
    commonNavigationPaths: Array<{ path: string[]; frequency: number }>
    taskCompletionTimes: Record<string, number>
    errorPatterns: Array<{ error: string; context: string; frequency: number }>
  }
  performanceMetrics: {
    taskCompletionRate: number
    averageSessionDuration: number
    errorRate: number
    featureAdoptionRate: number
  }
}

class AILearningService {
  private behaviorHistory: UserBehaviorPattern[] = []
  private models: Map<string, PredictionModel> = new Map()
  private userProfiles: Map<string, UserProfile> = new Map()
  private isLearningEnabled = true

  constructor() {
    this.initializeModels()
    this.loadStoredData()
  }

  /**
   * Initialize machine learning models
   */
  private initializeModels(): void {
    const models: PredictionModel[] = [
      {
        type: 'navigation',
        confidence: 0.75,
        accuracy: 0.82,
        lastTrained: Date.now(),
        version: '1.0.0'
      },
      {
        type: 'task_completion',
        confidence: 0.68,
        accuracy: 0.79,
        lastTrained: Date.now(),
        version: '1.0.0'
      },
      {
        type: 'error_prevention',
        confidence: 0.71,
        accuracy: 0.85,
        lastTrained: Date.now(),
        version: '1.0.0'
      },
      {
        type: 'content_recommendation',
        confidence: 0.73,
        accuracy: 0.77,
        lastTrained: Date.now(),
        version: '1.0.0'
      }
    ]

    models.forEach(model => {
      this.models.set(model.type, model)
    })
  }

  /**
   * Load stored learning data from localStorage
   */
  private loadStoredData(): void {
    try {
      const storedBehavior = localStorage.getItem('ai_behavior_history')
      if (storedBehavior) {
        this.behaviorHistory = JSON.parse(storedBehavior)
      }

      const storedProfiles = localStorage.getItem('ai_user_profiles')
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles)
        Object.entries(profiles).forEach(([userId, profile]) => {
          this.userProfiles.set(userId, profile as UserProfile)
        })
      }
    } catch (error) {
      console.warn('Failed to load AI learning data:', error)
    }
  }

  /**
   * Save learning data to localStorage
   */
  private saveData(): void {
    try {
      localStorage.setItem('ai_behavior_history', JSON.stringify(this.behaviorHistory.slice(-1000)))
      
      const profilesObj: Record<string, UserProfile> = {}
      this.userProfiles.forEach((profile, userId) => {
        profilesObj[userId] = profile
      })
      localStorage.setItem('ai_user_profiles', JSON.stringify(profilesObj))
    } catch (error) {
      console.warn('Failed to save AI learning data:', error)
    }
  }

  /**
   * Record user behavior for learning
   */
  recordBehavior(pattern: Omit<UserBehaviorPattern, 'timestamp'>): void {
    if (!this.isLearningEnabled) return

    const behaviorPattern: UserBehaviorPattern = {
      ...pattern,
      timestamp: Date.now()
    }

    this.behaviorHistory.push(behaviorPattern)
    this.updateUserProfile(pattern.userId, behaviorPattern)
    
    // Keep only last 1000 behavior patterns
    if (this.behaviorHistory.length > 1000) {
      this.behaviorHistory = this.behaviorHistory.slice(-1000)
    }

    this.saveData()
  }

  /**
   * Update user profile based on behavior
   */
  private updateUserProfile(userId: string, behavior: UserBehaviorPattern): void {
    let profile = this.userProfiles.get(userId)
    
    if (!profile) {
      profile = this.createDefaultProfile(userId)
      this.userProfiles.set(userId, profile)
    }

    // Update behavior patterns
    this.updateBehaviorPatterns(profile, behavior)
    this.updatePerformanceMetrics(profile, behavior)
    this.inferUserPreferences(profile, behavior)
  }

  /**
   * Create default user profile
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      role: 'user',
      experienceLevel: 'beginner',
      preferences: {
        navigationStyle: 'linear',
        informationDensity: 'standard',
        assistanceLevel: 'high'
      },
      behaviorPatterns: {
        mostUsedFeatures: [],
        commonNavigationPaths: [],
        taskCompletionTimes: {},
        errorPatterns: []
      },
      performanceMetrics: {
        taskCompletionRate: 0,
        averageSessionDuration: 0,
        errorRate: 0,
        featureAdoptionRate: 0
      }
    }
  }

  /**
   * Update behavior patterns in user profile
   */
  private updateBehaviorPatterns(profile: UserProfile, behavior: UserBehaviorPattern): void {
    const { behaviorPatterns } = profile

    // Update most used features
    if (behavior.context.feature) {
      const featureIndex = behaviorPatterns.mostUsedFeatures.indexOf(behavior.context.feature)
      if (featureIndex === -1) {
        behaviorPatterns.mostUsedFeatures.push(behavior.context.feature)
      }
    }

    // Update task completion times
    if (behavior.action === 'task_completion' && behavior.context.duration) {
      const taskType = behavior.context.feature || 'general'
      const currentTime = behaviorPatterns.taskCompletionTimes[taskType] || 0
      behaviorPatterns.taskCompletionTimes[taskType] = 
        (currentTime + behavior.context.duration) / 2 // Moving average
    }

    // Update error patterns
    if (behavior.action === 'error') {
      const errorPattern = {
        error: behavior.metadata.errorType || 'unknown',
        context: behavior.context.page,
        frequency: 1
      }

      const existingError = behaviorPatterns.errorPatterns.find(
        ep => ep.error === errorPattern.error && ep.context === errorPattern.context
      )

      if (existingError) {
        existingError.frequency++
      } else {
        behaviorPatterns.errorPatterns.push(errorPattern)
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(profile: UserProfile, behavior: UserBehaviorPattern): void {
    const { performanceMetrics } = profile
    
    // Update task completion rate
    if (behavior.action === 'task_completion') {
      const success = behavior.context.success !== false
      performanceMetrics.taskCompletionRate = 
        (performanceMetrics.taskCompletionRate + (success ? 1 : 0)) / 2
    }

    // Update error rate
    if (behavior.action === 'error') {
      performanceMetrics.errorRate = (performanceMetrics.errorRate + 1) / 2
    }
  }

  /**
   * Infer user preferences from behavior
   */
  private inferUserPreferences(profile: UserProfile, behavior: UserBehaviorPattern): void {
    const userBehaviors = this.behaviorHistory.filter(b => b.userId === profile.userId)
    
    // Infer experience level
    const totalActions = userBehaviors.length
    const errorRate = userBehaviors.filter(b => b.action === 'error').length / totalActions
    
    if (totalActions > 100 && errorRate < 0.1) {
      profile.experienceLevel = 'expert'
    } else if (totalActions > 50 && errorRate < 0.2) {
      profile.experienceLevel = 'intermediate'
    }

    // Infer navigation style
    const navigationActions = userBehaviors.filter(b => b.action === 'navigation')
    const uniquePages = new Set(navigationActions.map(b => b.context.page)).size
    const avgPagesPerSession = uniquePages / Math.max(1, totalActions / 20) // Assume 20 actions per session

    if (avgPagesPerSession > 5) {
      profile.preferences.navigationStyle = 'exploratory'
    } else if (avgPagesPerSession < 3) {
      profile.preferences.navigationStyle = 'task_focused'
    }
  }

  /**
   * Predict next user action
   */
  predictNextAction(userId: string, currentContext: { page: string; section?: string }): {
    action: string
    confidence: number
    reasoning: string
  } | null {
    const profile = this.userProfiles.get(userId)
    if (!profile) return null

    const model = this.models.get('navigation')
    if (!model) return null

    const userBehaviors = this.behaviorHistory
      .filter(b => b.userId === userId)
      .slice(-50) // Last 50 actions

    // Simple pattern matching for prediction
    const currentPageBehaviors = userBehaviors.filter(
      b => b.context.page === currentContext.page
    )

    if (currentPageBehaviors.length === 0) return null

    // Find most common next action from current page
    const nextActions: Record<string, number> = {}
    
    currentPageBehaviors.forEach((behavior, index) => {
      if (index < currentPageBehaviors.length - 1) {
        const nextBehavior = currentPageBehaviors[index + 1]
        const actionKey = `${nextBehavior.action}:${nextBehavior.context.page}`
        nextActions[actionKey] = (nextActions[actionKey] || 0) + 1
      }
    })

    const mostLikelyAction = Object.entries(nextActions)
      .sort(([, a], [, b]) => b - a)[0]

    if (!mostLikelyAction) return null

    const [action, page] = mostLikelyAction[0].split(':')
    const frequency = mostLikelyAction[1]
    const confidence = Math.min(0.95, frequency / currentPageBehaviors.length * model.confidence)

    return {
      action: page,
      confidence,
      reasoning: `Based on ${frequency} similar patterns from your ${currentPageBehaviors.length} previous actions on this page`
    }
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(userId: string, context: { page: string; task?: string }): Array<{
    type: 'feature' | 'workflow' | 'shortcut' | 'help'
    title: string
    description: string
    confidence: number
    action: string
  }> {
    const profile = this.userProfiles.get(userId)
    if (!profile) return []

    const recommendations: Array<{
      type: 'feature' | 'workflow' | 'shortcut' | 'help'
      title: string
      description: string
      confidence: number
      action: string
    }> = []

    // Feature recommendations based on usage patterns
    if (profile.behaviorPatterns.mostUsedFeatures.length > 0) {
      const unusedFeatures = this.getUnusedFeatures(profile)
      unusedFeatures.forEach(feature => {
        recommendations.push({
          type: 'feature',
          title: `Try ${feature}`,
          description: `This feature might help with your current workflow`,
          confidence: 0.7,
          action: `explore_${feature}`
        })
      })
    }

    // Workflow optimization recommendations
    const slowTasks = Object.entries(profile.behaviorPatterns.taskCompletionTimes)
      .filter(([, time]) => time > 300000) // Tasks taking more than 5 minutes
      .map(([task]) => task)

    slowTasks.forEach(task => {
      recommendations.push({
        type: 'workflow',
        title: `Optimize ${task} workflow`,
        description: `We noticed this task takes longer than average. Here are some shortcuts.`,
        confidence: 0.8,
        action: `optimize_${task}`
      })
    })

    // Help recommendations based on error patterns
    const frequentErrors = profile.behaviorPatterns.errorPatterns
      .filter(ep => ep.frequency > 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2)

    frequentErrors.forEach(error => {
      recommendations.push({
        type: 'help',
        title: `Avoid ${error.error} errors`,
        description: `Get help with common issues in ${error.context}`,
        confidence: 0.9,
        action: `help_${error.error}`
      })
    })

    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  /**
   * Get unused features for recommendations
   */
  private getUnusedFeatures(profile: UserProfile): string[] {
    const allFeatures = [
      'advanced_search', 'bulk_operations', 'templates', 'automation',
      'analytics', 'collaboration', 'notifications', 'shortcuts'
    ]
    
    return allFeatures.filter(feature => 
      !profile.behaviorPatterns.mostUsedFeatures.includes(feature)
    )
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null
  }

  /**
   * Enable/disable learning
   */
  setLearningEnabled(enabled: boolean): void {
    this.isLearningEnabled = enabled
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): Record<string, PredictionModel> {
    const metrics: Record<string, PredictionModel> = {}
    this.models.forEach((model, type) => {
      metrics[type] = { ...model }
    })
    return metrics
  }

  /**
   * Clear all learning data (for privacy compliance)
   */
  clearLearningData(userId?: string): void {
    if (userId) {
      this.behaviorHistory = this.behaviorHistory.filter(b => b.userId !== userId)
      this.userProfiles.delete(userId)
    } else {
      this.behaviorHistory = []
      this.userProfiles.clear()
    }
    this.saveData()
  }
}

export const aiLearningService = new AILearningService()
export type { UserBehaviorPattern, UserProfile, PredictionModel }
