/**
 * Regulations Controller for Regulatory Intelligence Service
 * Handles HTTP requests for regulations management operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';

export interface Regulation {
  id: string;
  circularNumber: string;
  title: string;
  category: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  publishedDate: string;
  effectiveDate?: string;
  status: 'active' | 'superseded' | 'withdrawn';
  summary: string;
  sourceUrl: string;
  affectedEntities: string[];
  requirements: ComplianceRequirement[];
  deadlines: ComplianceDeadline[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  applicableEntities: string[];
  frequency?: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface ComplianceDeadline {
  id: string;
  description: string;
  date: string;
  type: 'reporting' | 'implementation' | 'compliance' | 'review';
  applicableEntities: string[];
  consequences?: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
}

export interface SearchFilters {
  category?: string;
  impactLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  affectedEntity?: string;
}

export class RegulationsController {
  // Mock data store - in production, this would be replaced with database calls
  private regulations: Map<string, Regulation> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Get paginated list of regulations with filtering
   */
  public getRegulations = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      page = 1,
      limit = 20,
      search,
      category,
      impactLevel,
      status,
      startDate,
      endDate,
      affectedEntity,
      sort = 'publishedDate',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    logger.info('Regulations list requested', {
      page: pageNum,
      limit: limitNum,
      search,
      category,
      impactLevel,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      let filteredRegulations = Array.from(this.regulations.values());

      // Apply filters
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredRegulations = filteredRegulations.filter(reg =>
          reg.title.toLowerCase().includes(searchLower) ||
          reg.circularNumber.toLowerCase().includes(searchLower) ||
          reg.summary.toLowerCase().includes(searchLower)
        );
      }

      if (category) {
        filteredRegulations = filteredRegulations.filter(reg => reg.category === category);
      }

      if (impactLevel) {
        filteredRegulations = filteredRegulations.filter(reg => reg.impactLevel === impactLevel);
      }

      if (status) {
        filteredRegulations = filteredRegulations.filter(reg => reg.status === status);
      }

      if (affectedEntity) {
        filteredRegulations = filteredRegulations.filter(reg =>
          reg.affectedEntities.includes(affectedEntity as string)
        );
      }

      if (startDate) {
        filteredRegulations = filteredRegulations.filter(reg =>
          new Date(reg.publishedDate) >= new Date(startDate as string)
        );
      }

      if (endDate) {
        filteredRegulations = filteredRegulations.filter(reg =>
          new Date(reg.publishedDate) <= new Date(endDate as string)
        );
      }

      // Apply sorting
      filteredRegulations.sort((a, b) => {
        const aValue = this.getSortValue(a, sort as string);
        const bValue = this.getSortValue(b, sort as string);
        
        if (order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const total = filteredRegulations.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedRegulations = filteredRegulations.slice(startIndex, endIndex);

      const duration = Date.now() - startTime;

      loggers.business('get_regulations', {
        requestId: req.requestId,
        userId: req.user?.id,
        page: pageNum,
        limit: limitNum,
        total,
        filtered: filteredRegulations.length,
        returned: paginatedRegulations.length,
        duration: `${duration}ms`,
        success: true,
      });

      res.json({
        success: true,
        data: paginatedRegulations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          filters: { search, category, impactLevel, status, startDate, endDate, affectedEntity },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('get_regulations', {
        requestId: req.requestId,
        userId: req.user?.id,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get specific regulation details
   */
  public getRegulation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Regulation ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Regulation details requested', {
      regulationId: id,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const regulation = this.regulations.get(id);

      if (!regulation) {
        return res.status(404).json({
          success: false,
          error: 'Regulation not found',
          timestamp: new Date().toISOString(),
        });
      }

      loggers.business('get_regulation', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        success: true,
      });

      res.json({
        success: true,
        data: regulation,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_regulation', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Full-text search regulations
   */
  public searchRegulations = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      query,
      filters = {},
      page = 1,
      limit = 20,
      includeHighlights = true
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        timestamp: new Date().toISOString(),
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    logger.info('Regulation search requested', {
      query,
      filters,
      page: pageNum,
      limit: limitNum,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Perform search (simplified implementation)
      const searchResults = this.performSearch(query, filters as SearchFilters);

      // Apply pagination
      const total = searchResults.length;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      // Add highlights if requested
      const resultsWithHighlights = includeHighlights
        ? this.addSearchHighlights(paginatedResults, query)
        : paginatedResults;

      const duration = Date.now() - startTime;

      loggers.business('search_regulations', {
        requestId: req.requestId,
        userId: req.user?.id,
        query,
        total,
        returned: paginatedResults.length,
        duration: `${duration}ms`,
        success: true,
      });

      res.json({
        success: true,
        data: {
          results: resultsWithHighlights,
          totalResults: total,
          searchTime: `${duration}ms`,
          query,
          filters,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('search_regulations', {
        requestId: req.requestId,
        userId: req.user?.id,
        query,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get compliance requirements for a regulation
   */
  public getRegulationRequirements = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, priority, category } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Regulation ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Regulation requirements requested', {
      regulationId: id,
      status,
      priority,
      category,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const regulation = this.regulations.get(id);

      if (!regulation) {
        return res.status(404).json({
          success: false,
          error: 'Regulation not found',
          timestamp: new Date().toISOString(),
        });
      }

      let requirements = regulation.requirements;

      // Apply filters
      if (status) {
        requirements = requirements.filter(req => req.status === status);
      }

      if (priority) {
        requirements = requirements.filter(req => req.priority === priority);
      }

      if (category) {
        requirements = requirements.filter(req => req.category === category);
      }

      loggers.business('get_regulation_requirements', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        requirementCount: requirements.length,
        success: true,
      });

      res.json({
        success: true,
        data: {
          regulationId: id,
          requirements,
          summary: {
            total: requirements.length,
            byStatus: this.groupByField(requirements, 'status'),
            byPriority: this.groupByField(requirements, 'priority'),
            byCategory: this.groupByField(requirements, 'category'),
          },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_regulation_requirements', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get regulatory timeline and deadlines
   */
  public getRegulationTimeline = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { timeframe = '12m', includeCompleted = false } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Regulation ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Regulation timeline requested', {
      regulationId: id,
      timeframe,
      includeCompleted,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const regulation = this.regulations.get(id);

      if (!regulation) {
        return res.status(404).json({
          success: false,
          error: 'Regulation not found',
          timestamp: new Date().toISOString(),
        });
      }

      let deadlines = regulation.deadlines;

      // Filter by completion status
      if (!includeCompleted) {
        deadlines = deadlines.filter(deadline => deadline.status !== 'completed');
      }

      // Apply timeframe filter
      const timeframeDays = this.parseTimeframe(timeframe as string);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + timeframeDays);

      deadlines = deadlines.filter(deadline =>
        new Date(deadline.date) <= cutoffDate
      );

      // Sort by date
      deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      loggers.business('get_regulation_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        deadlineCount: deadlines.length,
        success: true,
      });

      res.json({
        success: true,
        data: {
          regulationId: id,
          regulationTitle: regulation.title,
          timeframe,
          deadlines,
          summary: {
            total: deadlines.length,
            upcoming: deadlines.filter(d => d.status === 'upcoming').length,
            dueSoon: deadlines.filter(d => d.status === 'due_soon').length,
            overdue: deadlines.filter(d => d.status === 'overdue').length,
            byType: this.groupByField(deadlines, 'type'),
          },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_regulation_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        regulationId: id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  // Helper methods
  private getSortValue(regulation: Regulation, sortField: string): any {
    switch (sortField) {
      case 'publishedDate':
        return new Date(regulation.publishedDate).getTime();
      case 'effectiveDate':
        return regulation.effectiveDate ? new Date(regulation.effectiveDate).getTime() : 0;
      case 'title':
        return regulation.title.toLowerCase();
      case 'impactLevel':
        const impactOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return impactOrder[regulation.impactLevel];
      default:
        return regulation.publishedDate;
    }
  }

  private performSearch(query: string, filters: SearchFilters): Regulation[] {
    const queryLower = query.toLowerCase();
    let results = Array.from(this.regulations.values());

    // Text search
    results = results.filter(reg =>
      reg.title.toLowerCase().includes(queryLower) ||
      reg.circularNumber.toLowerCase().includes(queryLower) ||
      reg.summary.toLowerCase().includes(queryLower) ||
      reg.category.toLowerCase().includes(queryLower) ||
      reg.requirements.some(req => 
        req.title.toLowerCase().includes(queryLower) ||
        req.description.toLowerCase().includes(queryLower)
      )
    );

    // Apply filters
    if (filters.category) {
      results = results.filter(reg => reg.category === filters.category);
    }

    if (filters.impactLevel) {
      results = results.filter(reg => reg.impactLevel === filters.impactLevel);
    }

    if (filters.status) {
      results = results.filter(reg => reg.status === filters.status);
    }

    if (filters.affectedEntity) {
      results = results.filter(reg => reg.affectedEntities.includes(filters.affectedEntity!));
    }

    if (filters.startDate) {
      results = results.filter(reg => new Date(reg.publishedDate) >= new Date(filters.startDate!));
    }

    if (filters.endDate) {
      results = results.filter(reg => new Date(reg.publishedDate) <= new Date(filters.endDate!));
    }

    return results;
  }

  private addSearchHighlights(regulations: Regulation[], query: string): any[] {
    const queryLower = query.toLowerCase();
    
    return regulations.map(reg => ({
      ...reg,
      highlights: {
        title: this.highlightText(reg.title, queryLower),
        summary: this.highlightText(reg.summary, queryLower),
      },
    }));
  }

  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([dwmy])$/);
    if (!match) return 365; // Default to 1 year

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 365;
    }
  }

  private initializeMockData(): void {
    // Initialize with sample regulations data
    const sampleRegulations: Regulation[] = [
      {
        id: 'reg-001',
        circularNumber: 'RBI/2024/001',
        title: 'Capital Adequacy Framework - Basel III Implementation',
        category: 'Capital Adequacy',
        impactLevel: 'high',
        publishedDate: '2024-01-15',
        effectiveDate: '2024-04-01',
        status: 'active',
        summary: 'Updated guidelines for capital adequacy framework implementation under Basel III norms',
        sourceUrl: 'https://rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx?Id=12345',
        affectedEntities: ['banks', 'nbfcs'],
        requirements: [
          {
            id: 'req-001',
            title: 'Maintain minimum capital ratio',
            description: 'Banks must maintain minimum 9% capital adequacy ratio',
            category: 'Capital Adequacy',
            priority: 'high',
            applicableEntities: ['banks'],
            frequency: 'quarterly',
            deadline: '2024-06-30',
            status: 'pending',
          },
        ],
        deadlines: [
          {
            id: 'deadline-001',
            description: 'Submit quarterly capital adequacy report',
            date: '2024-06-30',
            type: 'reporting',
            applicableEntities: ['banks'],
            status: 'upcoming',
          },
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      // Add more sample data as needed
    ];

    sampleRegulations.forEach(reg => {
      this.regulations.set(reg.id, reg);
    });

    logger.info('Mock regulations data initialized', {
      count: this.regulations.size,
    });
  }
}

export default RegulationsController;
