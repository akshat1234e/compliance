'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@/store'
import { addSearchQuery } from '@/store/slices/intelligenceSlice'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'

interface SearchResult {
  id: string
  type: 'regulation' | 'workflow' | 'document' | 'risk_assessment' | 'page' | 'action'
  title: string
  description: string
  url?: string
  action?: () => void
  relevance: number
  context?: string
  metadata?: Record<string, any>
}

interface SearchSuggestion {
  query: string
  type: 'recent' | 'popular' | 'ai_suggested'
  confidence?: number
}

interface IntelligentSearchProps {
  placeholder?: string
  onSearch?: (query: string, results: SearchResult[]) => void
  onResultClick?: (result: SearchResult) => void
  className?: string
  showRecentSearches?: boolean
  showAISuggestions?: boolean
}

export default function IntelligentSearch({
  placeholder = "Search regulations, workflows, documents...",
  onSearch,
  onResultClick,
  className = '',
  showRecentSearches = true,
  showAISuggestions = true
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { navigateWithContext } = useSmartNavigation()
  
  const { aiLearningData, userContext } = useAppSelector(state => state.intelligence)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock search data - in real implementation, this would come from APIs
  const mockSearchData: SearchResult[] = [
    {
      id: '1',
      type: 'regulation',
      title: 'RBI/2024/15 - Updated KYC Guidelines',
      description: 'New customer identification requirements and verification procedures',
      url: '/dashboard/regulatory/RBI-2024-15',
      relevance: 0.95,
      context: 'Recently updated regulation requiring immediate attention'
    },
    {
      id: '2',
      type: 'workflow',
      title: 'Q4 Risk Assessment Workflow',
      description: 'Quarterly risk assessment and compliance review process',
      url: '/dashboard/compliance/workflow/q4-risk-assessment',
      relevance: 0.88,
      context: 'Active workflow with pending tasks'
    },
    {
      id: '3',
      type: 'document',
      title: 'AML Compliance Manual 2024',
      description: 'Anti-Money Laundering compliance procedures and guidelines',
      url: '/dashboard/documents/aml-manual-2024',
      relevance: 0.82,
      context: 'Recently updated compliance documentation'
    },
    {
      id: '4',
      type: 'action',
      title: 'Create New Compliance Workflow',
      description: 'Start a new compliance workflow for regulatory requirements',
      action: () => navigateWithContext('/dashboard/compliance/create'),
      relevance: 0.75,
      context: 'Quick action based on your recent activity'
    }
  ]

  // Natural Language Processing for search queries
  const processNaturalLanguage = useCallback((searchQuery: string): SearchResult[] => {
    const lowerQuery = searchQuery.toLowerCase()
    let processedResults: SearchResult[] = []

    // Intent detection patterns
    const intentPatterns = {
      show: /^(show|display|list|find)\s+(.+)/i,
      create: /^(create|new|start|begin)\s+(.+)/i,
      update: /^(update|modify|change|edit)\s+(.+)/i,
      review: /^(review|check|examine|assess)\s+(.+)/i,
      deadline: /^(.+)\s+(due|deadline|expiring|expires?)\s+(.+)/i,
      risk: /^(.+)\s+(risk|risks|risky)\s*(.*)$/i,
      compliance: /^(.+)\s+(compliance|compliant|non-compliant)\s*(.*)$/i
    }

    // Process different intent patterns
    if (intentPatterns.show.test(lowerQuery)) {
      const match = lowerQuery.match(intentPatterns.show)
      const target = match?.[2] || ''
      
      if (target.includes('workflow')) {
        processedResults.push({
          id: 'action_show_workflows',
          type: 'action',
          title: 'Show All Workflows',
          description: 'Navigate to compliance workflows page',
          action: () => navigateWithContext('/dashboard/compliance'),
          relevance: 0.9,
          context: 'AI interpreted: Show workflows'
        })
      }
      
      if (target.includes('regulation')) {
        processedResults.push({
          id: 'action_show_regulations',
          type: 'action',
          title: 'Show All Regulations',
          description: 'Navigate to regulatory intelligence page',
          action: () => navigateWithContext('/dashboard/regulatory'),
          relevance: 0.9,
          context: 'AI interpreted: Show regulations'
        })
      }
    }

    if (intentPatterns.create.test(lowerQuery)) {
      const match = lowerQuery.match(intentPatterns.create)
      const target = match?.[2] || ''
      
      if (target.includes('workflow')) {
        processedResults.push({
          id: 'action_create_workflow',
          type: 'action',
          title: 'Create New Workflow',
          description: 'Start creating a new compliance workflow',
          action: () => navigateWithContext('/dashboard/compliance/create'),
          relevance: 0.95,
          context: 'AI interpreted: Create workflow'
        })
      }
    }

    if (intentPatterns.deadline.test(lowerQuery)) {
      processedResults.push({
        id: 'action_show_deadlines',
        type: 'action',
        title: 'Show Upcoming Deadlines',
        description: 'View all compliance deadlines and due dates',
        action: () => navigateWithContext('/dashboard/analytics?view=deadlines'),
        relevance: 0.85,
        context: 'AI interpreted: Deadline inquiry'
      })
    }

    // Keyword-based search in mock data
    const keywordResults = mockSearchData.filter(item => {
      const searchText = `${item.title} ${item.description}`.toLowerCase()
      const queryWords = lowerQuery.split(' ')
      return queryWords.some(word => searchText.includes(word))
    })

    // Combine AI-interpreted results with keyword results
    processedResults = [...processedResults, ...keywordResults]

    // Sort by relevance and remove duplicates
    return processedResults
      .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8) // Limit to top 8 results
  }, [navigateWithContext])

  // Perform intelligent search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const searchResults = processNaturalLanguage(searchQuery)
    setResults(searchResults)
    
    // Learn from search
    dispatch(addSearchQuery({
      query: searchQuery,
      results: searchResults.length,
      clicked: false
    }))
    
    onSearch?.(searchQuery, searchResults)
    setIsLoading(false)
  }, [processNaturalLanguage, dispatch, onSearch])

  // Generate search suggestions
  const generateSuggestions = useCallback(() => {
    const suggestions: SearchSuggestion[] = []
    
    // Recent searches
    if (showRecentSearches) {
      const recentQueries = aiLearningData.searchQueries
        .slice(-5)
        .map(sq => ({
          query: sq.query,
          type: 'recent' as const
        }))
      suggestions.push(...recentQueries)
    }
    
    // AI-suggested searches based on context
    if (showAISuggestions) {
      const contextSuggestions: SearchSuggestion[] = []
      
      if (userContext.currentPage.includes('regulatory')) {
        contextSuggestions.push({
          query: 'show high impact regulations',
          type: 'ai_suggested',
          confidence: 0.8
        })
      }
      
      if (userContext.currentPage.includes('compliance')) {
        contextSuggestions.push({
          query: 'create workflow for new regulation',
          type: 'ai_suggested',
          confidence: 0.85
        })
      }
      
      contextSuggestions.push({
        query: 'show workflows due this week',
        type: 'ai_suggested',
        confidence: 0.75
      })
      
      suggestions.push(...contextSuggestions)
    }
    
    setSuggestions(suggestions.slice(0, 6))
  }, [aiLearningData.searchQueries, userContext.currentPage, showRecentSearches, showAISuggestions])

  // Handle search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        performSearch(query)
      } else if (query.length === 0) {
        setResults([])
        generateSuggestions()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch, generateSuggestions])

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.action) {
      result.action()
    } else if (result.url) {
      navigateWithContext(result.url)
    }
    
    // Learn from click
    dispatch(addSearchQuery({
      query,
      results: results.length,
      clicked: true
    }))
    
    onResultClick?.(result)
    setIsOpen(false)
    setQuery('')
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query)
    performSearch(suggestion.query)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + suggestions.length
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleResultClick(results[selectedIndex])
          } else {
            const suggestionIndex = selectedIndex - results.length
            handleSuggestionClick(suggestions[suggestionIndex])
          }
        } else if (query.trim()) {
          performSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'regulation':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'workflow':
        return <ShieldCheckIcon className="h-4 w-4" />
      case 'risk_assessment':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'action':
        return <SparklesIcon className="h-4 w-4" />
      default:
        return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true)
            if (!query) generateSuggestions()
          }}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
          placeholder={placeholder}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              generateSuggestions()
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Search Results
              </div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                    selectedIndex === index ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1 text-gray-400">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {result.description}
                      </p>
                      {result.context && (
                        <p className="text-xs text-primary-600 mt-1">
                          {result.context}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400">
                      {Math.round(result.relevance * 100)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !query && suggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                    selectedIndex === results.length + index ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 text-gray-400">
                      {suggestion.type === 'recent' ? (
                        <ClockIcon className="h-4 w-4" />
                      ) : (
                        <SparklesIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{suggestion.query}</span>
                    {suggestion.type === 'ai_suggested' && (
                      <span className="text-xs text-primary-600 ml-auto">AI</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords or use natural language</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
