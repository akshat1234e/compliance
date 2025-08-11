/**
 * Circular Processor Service
 * Downloads, parses, and analyzes regulatory circulars using AI/ML
 */

import axios from 'axios';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { EventEmitter } from 'events';

import { logger } from '../utils/logger';
import { config } from '../config';
import { CircularDocument, ProcessedCircular, ComplianceRequirement, ImpactAssessment } from '../types/regulatory';

export class CircularProcessor extends EventEmitter {
  private aiServiceUrl: string;
  private processingQueue: Map<string, CircularDocument> = new Map();
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.aiServiceUrl = config.services.aiService.url;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Circular Processor...');
      
      // Test AI service connection
      await this.testAIServiceConnection();
      
      logger.info('✅ Circular Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Circular Processor:', error);
      throw error;
    }
  }

  public async processCircular(circular: CircularDocument): Promise<ProcessedCircular> {
    const startTime = Date.now();
    logger.info(`🔄 Processing circular: ${circular.number} - ${circular.title}`);

    try {
      // Step 1: Download document content
      const content = await this.downloadContent(circular.url);
      
      // Step 2: Extract text from document
      const extractedText = await this.extractText(content, circular.url);
      
      // Step 3: AI-powered analysis
      const analysis = await this.analyzeWithAI(extractedText, circular);
      
      // Step 4: Extract compliance requirements
      const requirements = await this.extractRequirements(extractedText);
      
      // Step 5: Assess impact
      const impact = await this.assessImpact(extractedText, circular);
      
      // Step 6: Generate summary
      const summary = await this.generateSummary(extractedText);
      
      // Step 7: Extract key information
      const keyInfo = await this.extractKeyInformation(extractedText);

      const processedCircular: ProcessedCircular = {
        ...circular,
        content: extractedText,
        summary,
        requirements,
        impact,
        analysis,
        keyInformation: keyInfo,
        processingMetadata: {
          processedAt: new Date(),
          processingDuration: Date.now() - startTime,
          contentLength: extractedText.length,
          requirementsCount: requirements.length,
          aiAnalysisVersion: '1.0.0'
        },
        status: 'processed'
      };

      // Emit processing complete event
      this.emit('circularProcessed', processedCircular);

      const duration = Date.now() - startTime;
      logger.info(`✅ Circular processed successfully in ${duration}ms: ${circular.number}`);

      return processedCircular;

    } catch (error) {
      logger.error(`❌ Failed to process circular ${circular.number}:`, error);
      
      // Return partially processed circular with error info
      const failedCircular: ProcessedCircular = {
        ...circular,
        content: '',
        summary: 'Processing failed',
        requirements: [],
        impact: {
          level: 'unknown',
          areas: [],
          description: 'Impact assessment failed due to processing error',
          timeline: 'unknown',
          affectedEntities: []
        },
        analysis: {
          category: 'unknown',
          priority: 'medium',
          tags: [],
          entities: [],
          sentiment: 'neutral',
          confidence: 0
        },
        keyInformation: {
          effectiveDate: null,
          deadline: null,
          applicableEntities: [],
          keyChanges: [],
          actionItems: []
        },
        processingMetadata: {
          processedAt: new Date(),
          processingDuration: Date.now() - startTime,
          contentLength: 0,
          requirementsCount: 0,
          aiAnalysisVersion: '1.0.0',
          error: error.message
        },
        status: 'failed'
      };

      this.emit('circularProcessingFailed', failedCircular);
      return failedCircular;
    }
  }

  private async downloadContent(url: string): Promise<Buffer> {
    try {
      logger.debug(`📥 Downloading content from: ${url}`);
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024, // 50MB limit
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const buffer = Buffer.from(response.data);
      logger.debug(`📥 Downloaded ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      logger.error(`Failed to download content from ${url}:`, error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  private async extractText(content: Buffer, url: string): Promise<string> {
    try {
      const fileExtension = this.getFileExtension(url);
      
      switch (fileExtension) {
        case 'pdf':
          return await this.extractTextFromPDF(content);
        case 'doc':
        case 'docx':
          return await this.extractTextFromWord(content);
        case 'html':
        case 'htm':
          return await this.extractTextFromHTML(content);
        default:
          // Try to extract as plain text
          return content.toString('utf-8');
      }
    } catch (error) {
      logger.error(`Failed to extract text from ${url}:`, error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      logger.error('PDF text extraction failed:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  private async extractTextFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Word document text extraction failed:', error);
      throw new Error(`Word extraction failed: ${error.message}`);
    }
  }

  private async extractTextFromHTML(buffer: Buffer): Promise<string> {
    try {
      const cheerio = require('cheerio');
      const $ = cheerio.load(buffer.toString());
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Extract text content
      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
      logger.error('HTML text extraction failed:', error);
      throw new Error(`HTML extraction failed: ${error.message}`);
    }
  }

  private async analyzeWithAI(text: string, circular: CircularDocument): Promise<any> {
    try {
      logger.debug('🤖 Performing AI analysis...');
      
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/nlp/analyze`, {
        text,
        document_type: 'regulatory_circular',
        analysis_type: ['sentiment', 'entities', 'classification', 'keyphrases'],
        metadata: {
          source: circular.sourceId,
          title: circular.title,
          number: circular.number,
          date: circular.date
        }
      }, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.services.aiService.apiKey}`
        }
      });

      if (response.data.success) {
        return {
          category: this.determineCategory(response.data.data),
          priority: this.determinePriority(response.data.data),
          tags: this.extractTags(response.data.data),
          entities: response.data.data.entities?.entities || [],
          sentiment: response.data.data.sentiment?.label || 'neutral',
          confidence: response.data.data.sentiment?.confidence || 0,
          keyphrases: response.data.data.keyphrases?.phrases || []
        };
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (error) {
      logger.error('AI analysis failed:', error);
      
      // Return basic analysis based on title and content
      return {
        category: this.basicCategoryDetection(circular.title + ' ' + text),
        priority: 'medium',
        tags: this.basicTagExtraction(circular.title),
        entities: [],
        sentiment: 'neutral',
        confidence: 0.5,
        keyphrases: []
      };
    }
  }

  private async extractRequirements(text: string): Promise<ComplianceRequirement[]> {
    try {
      logger.debug('📋 Extracting compliance requirements...');
      
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/regulatory/extract-requirements`, {
        text,
        document_type: 'circular'
      }, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.services.aiService.apiKey}`
        }
      });

      if (response.data.success) {
        return response.data.data.requirements.map((req: any) => ({
          id: req.id,
          text: req.text,
          type: req.requirement_type,
          priority: req.priority,
          deadline: req.deadline ? new Date(req.deadline) : null,
          applicableEntities: req.applicable_entities,
          actions: req.compliance_actions,
          section: req.section,
          confidence: req.confidence_score
        }));
      } else {
        throw new Error('Requirements extraction failed');
      }
    } catch (error) {
      logger.error('Requirements extraction failed:', error);
      
      // Return basic requirements extraction
      return this.basicRequirementsExtraction(text);
    }
  }

  private async assessImpact(text: string, circular: CircularDocument): Promise<ImpactAssessment> {
    try {
      logger.debug('📊 Assessing regulatory impact...');
      
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/risk/assess-regulatory-impact`, {
        text,
        circular_metadata: {
          source: circular.sourceId,
          title: circular.title,
          number: circular.number,
          date: circular.date
        }
      }, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.services.aiService.apiKey}`
        }
      });

      if (response.data.success) {
        const impact = response.data.data;
        return {
          level: impact.impact_level,
          areas: impact.impact_areas,
          description: impact.description,
          timeline: impact.timeline_estimate,
          affectedEntities: impact.affected_entities,
          riskFactors: impact.risk_factors,
          mitigationActions: impact.mitigation_actions
        };
      } else {
        throw new Error('Impact assessment failed');
      }
    } catch (error) {
      logger.error('Impact assessment failed:', error);
      
      // Return basic impact assessment
      return this.basicImpactAssessment(text, circular);
    }
  }

  private async generateSummary(text: string): Promise<string> {
    try {
      logger.debug('📝 Generating summary...');
      
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/nlp/summarize`, {
        text,
        max_length: 500,
        summary_type: 'extractive'
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.services.aiService.apiKey}`
        }
      });

      if (response.data.success) {
        return response.data.data.summary;
      } else {
        throw new Error('Summary generation failed');
      }
    } catch (error) {
      logger.error('Summary generation failed:', error);
      
      // Return basic summary (first few sentences)
      const sentences = text.split('.').slice(0, 3);
      return sentences.join('.') + '.';
    }
  }

  private async extractKeyInformation(text: string): Promise<any> {
    try {
      // Extract key dates, entities, and action items
      const dateRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g;
      const dates = text.match(dateRegex) || [];
      
      const entityRegex = /\b(bank|banks|NBFC|NBFCs|financial institution|financial institutions)\b/gi;
      const entities = [...new Set(text.match(entityRegex) || [])];
      
      const actionRegex = /\b(shall|must|should|required to|need to)\s+([^.]+)/gi;
      const actions = [];
      let match;
      while ((match = actionRegex.exec(text)) !== null) {
        actions.push(match[2].trim());
      }

      return {
        effectiveDate: dates.length > 0 ? new Date(dates[0]) : null,
        deadline: dates.length > 1 ? new Date(dates[dates.length - 1]) : null,
        applicableEntities: entities,
        keyChanges: this.extractKeyChanges(text),
        actionItems: actions.slice(0, 10) // Top 10 action items
      };
    } catch (error) {
      logger.error('Key information extraction failed:', error);
      return {
        effectiveDate: null,
        deadline: null,
        applicableEntities: [],
        keyChanges: [],
        actionItems: []
      };
    }
  }

  private getFileExtension(url: string): string {
    const path = new URL(url).pathname;
    const extension = path.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  private determineCategory(analysisData: any): string {
    // Determine category based on AI analysis
    const entities = analysisData.entities?.entities || [];
    const keyphrases = analysisData.keyphrases?.phrases || [];
    
    const categoryKeywords = {
      'capital_adequacy': ['capital', 'crar', 'tier 1', 'tier 2', 'leverage ratio'],
      'risk_management': ['risk', 'credit risk', 'operational risk', 'market risk'],
      'compliance': ['compliance', 'regulatory', 'audit', 'reporting'],
      'technology': ['technology', 'cyber', 'digital', 'IT', 'system'],
      'governance': ['governance', 'board', 'director', 'committee'],
      'customer_protection': ['customer', 'grievance', 'protection', 'fair practice']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (entities.some((e: any) => e.text.toLowerCase().includes(keyword)) ||
            keyphrases.some((p: any) => p.text.toLowerCase().includes(keyword))) {
          return category;
        }
      }
    }

    return 'general';
  }

  private determinePriority(analysisData: any): string {
    const sentiment = analysisData.sentiment?.label || 'neutral';
    const confidence = analysisData.sentiment?.confidence || 0;
    
    if (sentiment === 'negative' && confidence > 0.7) {
      return 'high';
    } else if (sentiment === 'positive' && confidence > 0.7) {
      return 'low';
    }
    
    return 'medium';
  }

  private extractTags(analysisData: any): string[] {
    const tags = [];
    const entities = analysisData.entities?.entities || [];
    const keyphrases = analysisData.keyphrases?.phrases || [];
    
    // Add entity-based tags
    entities.forEach((entity: any) => {
      if (entity.label === 'ORG') {
        tags.push('organization');
      } else if (entity.label === 'DATE') {
        tags.push('time-sensitive');
      } else if (entity.label === 'MONEY') {
        tags.push('financial');
      }
    });
    
    // Add keyphrase-based tags
    keyphrases.slice(0, 5).forEach((phrase: any) => {
      tags.push(phrase.text.toLowerCase().replace(/\s+/g, '_'));
    });
    
    return [...new Set(tags)];
  }

  private basicCategoryDetection(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('capital') || lowerText.includes('crar')) {
      return 'capital_adequacy';
    } else if (lowerText.includes('risk')) {
      return 'risk_management';
    } else if (lowerText.includes('technology') || lowerText.includes('cyber')) {
      return 'technology';
    } else if (lowerText.includes('customer') || lowerText.includes('grievance')) {
      return 'customer_protection';
    }
    
    return 'general';
  }

  private basicTagExtraction(title: string): string[] {
    const words = title.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }

  private basicRequirementsExtraction(text: string): ComplianceRequirement[] {
    const requirements = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      if (lowerSentence.includes('shall') || lowerSentence.includes('must') || lowerSentence.includes('required')) {
        requirements.push({
          id: `req_${index}`,
          text: sentence.trim(),
          type: 'mandatory',
          priority: 'medium',
          deadline: null,
          applicableEntities: ['all'],
          actions: ['comply'],
          section: 'general',
          confidence: 0.6
        });
      }
    });
    
    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  private basicImpactAssessment(text: string, circular: CircularDocument): ImpactAssessment {
    const lowerText = text.toLowerCase();
    let level = 'medium';
    
    if (lowerText.includes('immediate') || lowerText.includes('urgent') || lowerText.includes('penalty')) {
      level = 'high';
    } else if (lowerText.includes('clarification') || lowerText.includes('guidance')) {
      level = 'low';
    }
    
    return {
      level,
      areas: ['compliance', 'operations'],
      description: `Impact assessment for ${circular.title}`,
      timeline: '3-6 months',
      affectedEntities: ['banks', 'NBFCs'],
      riskFactors: ['regulatory compliance'],
      mitigationActions: ['review and implement changes']
    };
  }

  private extractKeyChanges(text: string): string[] {
    const changes = [];
    const changeIndicators = ['new', 'revised', 'updated', 'modified', 'introduced', 'amended'];
    
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (changeIndicators.some(indicator => lowerSentence.includes(indicator))) {
        changes.push(sentence.trim());
      }
    });
    
    return changes.slice(0, 5); // Top 5 key changes
  }

  private async testAIServiceConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 10000
      });
      
      if (response.status !== 200) {
        throw new Error(`AI service health check failed: ${response.status}`);
      }
      
      logger.info('✅ AI service connection verified');
    } catch (error) {
      logger.warn('⚠️ AI service connection failed, will use fallback processing:', error.message);
      // Don't throw error, allow service to start with fallback processing
    }
  }

  public async stop(): Promise<void> {
    try {
      this.isProcessing = false;
      this.processingQueue.clear();
      logger.info('✅ Circular Processor stopped');
    } catch (error) {
      logger.error('Error stopping Circular Processor:', error);
    }
  }
}
