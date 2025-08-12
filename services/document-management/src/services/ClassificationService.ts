/**
 * Classification Service
 * Document classification and categorization service
 */

import { config } from '@config/index';
import { logger } from '@utils/logger';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface ClassificationResult {
  category: string;
  confidence: number;
  subcategory?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ClassificationRule {
  pattern: RegExp;
  category: string;
  weight: number;
  subcategory?: string;
  tags?: string[];
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  createdDate?: Date;
  modifiedDate?: Date;
  fileType?: string;
  language?: string;
}

export class ClassificationService extends EventEmitter {
  private isInitialized = false;
  private classificationRules: ClassificationRule[] = [];
  private aiServiceUrl: string;
  private categories: string[] = [];

  constructor() {
    super();
    this.aiServiceUrl = config.aiService?.url || 'http://localhost:8000';
    this.categories = config.classification.categories;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Classification service already initialized');
      return;
    }

    try {
      logger.info('Initializing Classification Service...');

      // Initialize classification rules
      this.initializeRules();

      // Test AI service connection if enabled
      if (config.features.aiClassification) {
        await this.testAIServiceConnection();
      }

      this.isInitialized = true;
      logger.info('Classification Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Classification Service', error);
      throw error;
    }
  }

  private initializeRules(): void {
    this.classificationRules = [
      // RBI Regulatory Documents
      {
        pattern: /rbi|reserve bank of india|central bank|monetary policy|banking regulation/i,
        category: 'regulatory_circular',
        weight: 0.9,
        subcategory: 'rbi_circular',
        tags: ['regulatory', 'rbi', 'banking']
      },
      {
        pattern: /circular|notification|directive|guideline.*rbi/i,
        category: 'regulatory_circular',
        weight: 0.85,
        subcategory: 'rbi_circular',
        tags: ['circular', 'directive']
      },

      // Compliance Reports
      {
        pattern: /compliance.*report|adherence.*report|regulatory.*compliance/i,
        category: 'compliance_report',
        weight: 0.8,
        subcategory: 'compliance_status',
        tags: ['compliance', 'report', 'status']
      },
      {
        pattern: /quarterly.*compliance|monthly.*compliance|annual.*compliance/i,
        category: 'compliance_report',
        weight: 0.85,
        subcategory: 'periodic_report',
        tags: ['compliance', 'periodic', 'report']
      },

      // Audit Documents
      {
        pattern: /audit.*report|inspection.*report|examination.*report/i,
        category: 'audit_document',
        weight: 0.8,
        subcategory: 'audit_report',
        tags: ['audit', 'inspection', 'examination']
      },
      {
        pattern: /internal.*audit|external.*audit|statutory.*audit/i,
        category: 'audit_document',
        weight: 0.75,
        subcategory: 'audit_type',
        tags: ['audit', 'internal', 'external']
      },

      // Policy Documents
      {
        pattern: /policy|procedure|guideline|manual|framework/i,
        category: 'policy_document',
        weight: 0.7,
        subcategory: 'policy',
        tags: ['policy', 'procedure', 'guideline']
      },
      {
        pattern: /standard operating procedure|sop|operational.*manual/i,
        category: 'policy_document',
        weight: 0.8,
        subcategory: 'sop',
        tags: ['sop', 'procedure', 'operational']
      },

      // Legal Documents
      {
        pattern: /agreement|contract|legal.*notice|court.*order|judgment/i,
        category: 'legal_document',
        weight: 0.8,
        subcategory: 'legal',
        tags: ['legal', 'contract', 'agreement']
      },

      // Financial Statements
      {
        pattern: /balance.*sheet|profit.*loss|financial.*statement|income.*statement/i,
        category: 'financial_statement',
        weight: 0.85,
        subcategory: 'financial_report',
        tags: ['financial', 'statement', 'report']
      },

      // Training Materials
      {
        pattern: /training.*material|educational.*content|learning.*module|course.*content/i,
        category: 'training_material',
        weight: 0.75,
        subcategory: 'training',
        tags: ['training', 'education', 'learning']
      },

      // Correspondence
      {
        pattern: /letter|correspondence|communication|memo|memorandum/i,
        category: 'correspondence',
        weight: 0.6,
        subcategory: 'communication',
        tags: ['correspondence', 'communication']
      }
    ];

    logger.info(`Initialized ${this.classificationRules.length} classification rules`);
  }

  private async testAIServiceConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        logger.info('AI service connection successful');
      } else {
        logger.warn('AI service responded with non-200 status', { status: response.status });
      }
    } catch (error) {
      logger.warn('AI service connection failed, falling back to rule-based classification', { error });
    }
  }

  public async classifyDocument(
    text: string,
    metadata?: DocumentMetadata,
    options: { useAI?: boolean; confidenceThreshold?: number } = {}
  ): Promise<ClassificationResult[]> {
    if (!this.isInitialized) {
      throw new Error('Classification Service not initialized');
    }

    try {
      logger.info('Starting document classification', {
        textLength: text.length,
        useAI: options.useAI !== false && config.features.aiClassification,
        confidenceThreshold: options.confidenceThreshold || config.classification.confidenceThreshold
      });

      const results: ClassificationResult[] = [];

      // Rule-based classification
      const ruleBasedResults = await this.classifyWithRules(text, metadata);
      results.push(...ruleBasedResults);

      // AI-based classification if enabled
      if (options.useAI !== false && config.features.aiClassification) {
        try {
          const aiResults = await this.classifyWithAI(text, metadata);
          results.push(...aiResults);
        } catch (error) {
          logger.warn('AI classification failed, using rule-based results only', { error });
        }
      }

      // Merge and deduplicate results
      const mergedResults = this.mergeClassificationResults(results);

      // Filter by confidence threshold
      const threshold = options.confidenceThreshold || config.classification.confidenceThreshold;
      const filteredResults = mergedResults.filter(result => result.confidence >= threshold);

      // Sort by confidence
      filteredResults.sort((a, b) => b.confidence - a.confidence);

      logger.info('Document classification completed', {
        totalResults: filteredResults.length,
        topCategory: filteredResults[0]?.category,
        topConfidence: filteredResults[0]?.confidence
      });

      return filteredResults;

    } catch (error) {
      logger.error('Document classification failed', { error });
      throw error;
    }
  }

  private async classifyWithRules(text: string, metadata?: DocumentMetadata): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    const textLower = text.toLowerCase();
    const titleLower = metadata?.title?.toLowerCase() || '';
    const subjectLower = metadata?.subject?.toLowerCase() || '';
    const combinedText = `${textLower} ${titleLower} ${subjectLower}`;

    for (const rule of this.classificationRules) {
      const matches = combinedText.match(rule.pattern);
      if (matches) {
        const confidence = Math.min(rule.weight * (matches.length / 10 + 0.5), 1.0);

        results.push({
          category: rule.category,
          confidence,
          subcategory: rule.subcategory,
          tags: rule.tags,
          metadata: {
            method: 'rule_based',
            rule_pattern: rule.pattern.source,
            matches_count: matches.length
          }
        });
      }
    }

    return results;
  }

  private async classifyWithAI(text: string, metadata?: DocumentMetadata): Promise<ClassificationResult[]> {
    try {
      const payload = {
        text: text.substring(0, 10000), // Limit text size for API
        metadata,
        categories: this.categories
      };

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/document/classify`,
        payload,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'document-management'
          }
        }
      );

      if (response.data && response.data.classifications) {
        return response.data.classifications.map((classification: any) => ({
          category: classification.category,
          confidence: classification.confidence,
          subcategory: classification.subcategory,
          tags: classification.tags,
          metadata: {
            method: 'ai_based',
            model: response.data.model || 'unknown',
            processing_time: response.data.processing_time
          }
        }));
      }

      return [];

    } catch (error) {
      logger.error('AI classification request failed', { error });
      throw error;
    }
  }

  private mergeClassificationResults(results: ClassificationResult[]): ClassificationResult[] {
    const categoryMap = new Map<string, ClassificationResult>();

    for (const result of results) {
      const key = `${result.category}_${result.subcategory || 'default'}`;

      if (categoryMap.has(key)) {
        const existing = categoryMap.get(key)!;
        // Combine confidences using weighted average
        const totalWeight = 2; // Rule-based + AI-based
        const combinedConfidence = (existing.confidence + result.confidence) / totalWeight;

        existing.confidence = Math.min(combinedConfidence, 1.0);
        existing.tags = [...new Set([...(existing.tags || []), ...(result.tags || [])])];
        existing.metadata = {
          ...existing.metadata,
          ...result.metadata,
          combined: true
        };
      } else {
        categoryMap.set(key, { ...result });
      }
    }

    return Array.from(categoryMap.values());
  }

  public async classifyBatch(
    documents: Array<{ text: string; metadata?: DocumentMetadata }>,
    options: { useAI?: boolean; confidenceThreshold?: number } = {}
  ): Promise<ClassificationResult[][]> {
    const results: ClassificationResult[][] = [];

    for (const doc of documents) {
      try {
        const classification = await this.classifyDocument(doc.text, doc.metadata, options);
        results.push(classification);
      } catch (error) {
        logger.error('Failed to classify document in batch', { error });
        results.push([]);
      }
    }

    return results;
  }

  public async getCategories(): Promise<string[]> {
    return [...this.categories];
  }

  public async addCustomRule(rule: ClassificationRule): Promise<void> {
    this.classificationRules.push(rule);
    logger.info('Added custom classification rule', {
      category: rule.category,
      pattern: rule.pattern.source
    });
  }

  public async removeCustomRule(pattern: string): Promise<boolean> {
    const initialLength = this.classificationRules.length;
    this.classificationRules = this.classificationRules.filter(
      rule => rule.pattern.source !== pattern
    );

    const removed = this.classificationRules.length < initialLength;
    if (removed) {
      logger.info('Removed custom classification rule', { pattern });
    }

    return removed;
  }

  public async getClassificationStats(): Promise<{
    totalRules: number;
    categories: string[];
    aiServiceStatus: 'connected' | 'disconnected' | 'unknown';
  }> {
    let aiServiceStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';

    if (config.features.aiClassification) {
      try {
        await this.testAIServiceConnection();
        aiServiceStatus = 'connected';
      } catch {
        aiServiceStatus = 'disconnected';
      }
    }

    return {
      totalRules: this.classificationRules.length,
      categories: [...this.categories],
      aiServiceStatus
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Classification Service...');
    this.classificationRules = [];
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Classification Service shutdown completed');
  }
}

export default ClassificationService;
