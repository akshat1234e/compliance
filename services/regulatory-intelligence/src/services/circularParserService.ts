/**
 * Circular Parser Service
 * NLP-based parser to extract structured data from RBI circular content
 */

import natural from 'natural';
import compromise from 'compromise';
import { logger, loggers } from '@utils/logger';
import { config } from '@config/index';

export interface ParsedCircular {
  circularId: string;
  metadata: CircularMetadata;
  content: ParsedContent;
  analysis: CircularAnalysis;
  confidence: number;
  processingTime: number;
  parsedAt: string;
}

export interface CircularMetadata {
  circularNumber: string;
  title: string;
  circularDate: string;
  effectiveDate?: string;
  expiryDate?: string;
  category: string;
  subCategory?: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedEntities: string[];
  sourceUrl: string;
}

export interface ParsedContent {
  summary: string;
  keyPoints: string[];
  requirements: ComplianceRequirement[];
  deadlines: Deadline[];
  references: Reference[];
  definitions: Definition[];
  sections: ContentSection[];
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency?: string;
  applicableEntities: string[];
  deadline?: string;
  penalties?: string;
}

export interface Deadline {
  description: string;
  date: string;
  type: 'implementation' | 'compliance' | 'reporting' | 'submission';
  applicableEntities: string[];
  consequences?: string;
}

export interface Reference {
  type: 'circular' | 'act' | 'regulation' | 'guideline';
  title: string;
  number?: string;
  date?: string;
  url?: string;
}

export interface Definition {
  term: string;
  definition: string;
  context: string;
}

export interface ContentSection {
  title: string;
  content: string;
  subsections?: ContentSection[];
  importance: number;
}

export interface CircularAnalysis {
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
  };
  complexity: {
    score: number;
    level: 'simple' | 'moderate' | 'complex' | 'very_complex';
  };
  urgency: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'urgent';
  };
  topics: string[];
  entities: NamedEntity[];
  keywords: string[];
}

export interface NamedEntity {
  text: string;
  type: 'ORGANIZATION' | 'PERSON' | 'LOCATION' | 'DATE' | 'MONEY' | 'PERCENT' | 'REGULATION';
  confidence: number;
}

export class CircularParserService {
  private tokenizer: natural.WordTokenizer;
  private stemmer: natural.PorterStemmer;
  private sentiment: natural.SentimentAnalyzer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    
    this.initializeNLP();
  }

  private initializeNLP(): void {
    // Initialize NLP components
    logger.info('Initializing NLP components for circular parsing');
  }

  /**
   * Parse a circular and extract structured data
   */
  public async parseCircular(
    circularId: string,
    rawContent: string,
    metadata: Partial<CircularMetadata>
  ): Promise<ParsedCircular> {
    const startTime = Date.now();

    try {
      loggers.nlp('circular_parsing', rawContent.length, undefined, undefined);

      // Clean and preprocess content
      const cleanContent = this.preprocessContent(rawContent);

      // Extract metadata
      const enhancedMetadata = await this.extractMetadata(cleanContent, metadata);

      // Parse content structure
      const parsedContent = await this.parseContent(cleanContent);

      // Perform analysis
      const analysis = await this.analyzeContent(cleanContent);

      // Calculate confidence score
      const confidence = this.calculateConfidence(parsedContent, analysis);

      const processingTime = Date.now() - startTime;

      const result: ParsedCircular = {
        circularId,
        metadata: enhancedMetadata,
        content: parsedContent,
        analysis,
        confidence,
        processingTime,
        parsedAt: new Date().toISOString(),
      };

      loggers.nlp('circular_parsing', rawContent.length, confidence, processingTime);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggers.nlp('circular_parsing', rawContent.length, undefined, processingTime, error as Error);
      throw error;
    }
  }

  /**
   * Preprocess content for better parsing
   */
  private preprocessContent(content: string): string {
    // Remove HTML tags if present
    let cleaned = content.replace(/<[^>]*>/g, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remove special characters but keep punctuation
    cleaned = cleaned.replace(/[^\w\s.,;:!?()-]/g, '');
    
    // Normalize common abbreviations
    cleaned = cleaned.replace(/\bRBI\b/g, 'Reserve Bank of India');
    cleaned = cleaned.replace(/\bNBFC\b/g, 'Non-Banking Financial Company');
    cleaned = cleaned.replace(/\bKYC\b/g, 'Know Your Customer');
    cleaned = cleaned.replace(/\bAML\b/g, 'Anti Money Laundering');
    
    return cleaned;
  }

  /**
   * Extract and enhance metadata from content
   */
  private async extractMetadata(
    content: string,
    existingMetadata: Partial<CircularMetadata>
  ): Promise<CircularMetadata> {
    const doc = compromise(content);

    // Extract dates
    const dates = doc.dates().out('array');
    const effectiveDate = this.findEffectiveDate(content, dates);
    const expiryDate = this.findExpiryDate(content, dates);

    // Determine category and impact level
    const category = this.categorizeContent(content);
    const impactLevel = this.assessImpactLevel(content);

    // Extract affected entities
    const affectedEntities = this.extractAffectedEntities(content);

    return {
      circularNumber: existingMetadata.circularNumber || 'UNKNOWN',
      title: existingMetadata.title || 'Untitled Circular',
      circularDate: existingMetadata.circularDate || new Date().toISOString().split('T')[0],
      effectiveDate,
      expiryDate,
      category,
      subCategory: this.extractSubCategory(content, category),
      impactLevel,
      affectedEntities,
      sourceUrl: existingMetadata.sourceUrl || '',
    };
  }

  /**
   * Parse content into structured sections
   */
  private async parseContent(content: string): Promise<ParsedContent> {
    const doc = compromise(content);

    // Extract summary
    const summary = this.extractSummary(content);

    // Extract key points
    const keyPoints = this.extractKeyPoints(content);

    // Extract compliance requirements
    const requirements = this.extractRequirements(content);

    // Extract deadlines
    const deadlines = this.extractDeadlines(content);

    // Extract references
    const references = this.extractReferences(content);

    // Extract definitions
    const definitions = this.extractDefinitions(content);

    // Parse sections
    const sections = this.parseSections(content);

    return {
      summary,
      keyPoints,
      requirements,
      deadlines,
      references,
      definitions,
      sections,
    };
  }

  /**
   * Analyze content for sentiment, complexity, and other metrics
   */
  private async analyzeContent(content: string): Promise<CircularAnalysis> {
    const doc = compromise(content);

    // Sentiment analysis
    const tokens = this.tokenizer.tokenize(content.toLowerCase()) || [];
    const sentimentScore = this.sentiment.getSentiment(tokens);
    const sentiment = {
      score: sentimentScore,
      label: this.getSentimentLabel(sentimentScore),
    };

    // Complexity analysis
    const complexity = this.analyzeComplexity(content);

    // Urgency analysis
    const urgency = this.analyzeUrgency(content);

    // Topic extraction
    const topics = this.extractTopics(content);

    // Named entity recognition
    const entities = this.extractNamedEntities(content);

    // Keyword extraction
    const keywords = this.extractKeywords(content);

    return {
      sentiment,
      complexity,
      urgency,
      topics,
      entities,
      keywords,
    };
  }

  /**
   * Extract summary from content
   */
  private extractSummary(content: string): string {
    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= 3) {
      return sentences.join('. ').trim() + '.';
    }

    // Score sentences based on keyword frequency and position
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position score (earlier sentences get higher scores)
      score += (sentences.length - index) / sentences.length;
      
      // Keyword score
      const keywords = ['shall', 'must', 'required', 'compliance', 'regulation', 'guideline'];
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          score += 0.5;
        }
      });
      
      return { sentence, score };
    });

    // Select top 3 sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence);

    return topSentences.join('. ').trim() + '.';
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];
    
    // Look for numbered lists
    const numberedMatches = content.match(/\d+\.\s+([^.]+\.)/g);
    if (numberedMatches) {
      keyPoints.push(...numberedMatches.map(match => match.replace(/^\d+\.\s+/, '')));
    }

    // Look for bullet points
    const bulletMatches = content.match(/[•·-]\s+([^.]+\.)/g);
    if (bulletMatches) {
      keyPoints.push(...bulletMatches.map(match => match.replace(/^[•·-]\s+/, '')));
    }

    // Look for sentences with strong indicators
    const strongIndicators = ['shall', 'must', 'required to', 'mandatory', 'prohibited'];
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (strongIndicators.some(indicator => 
        sentence.toLowerCase().includes(indicator))) {
        keyPoints.push(sentence.trim() + '.');
      }
    });

    return [...new Set(keyPoints)].slice(0, 10); // Remove duplicates and limit
  }

  /**
   * Calculate confidence score based on parsing results
   */
  private calculateConfidence(content: ParsedContent, analysis: CircularAnalysis): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on extracted elements
    if (content.summary.length > 50) confidence += 0.1;
    if (content.keyPoints.length > 0) confidence += 0.1;
    if (content.requirements.length > 0) confidence += 0.15;
    if (content.deadlines.length > 0) confidence += 0.1;
    if (content.references.length > 0) confidence += 0.05;

    // Boost confidence based on analysis quality
    if (analysis.entities.length > 0) confidence += 0.1;
    if (analysis.keywords.length > 5) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  // Helper methods (simplified implementations)
  private findEffectiveDate(content: string, dates: string[]): string | undefined {
    const effectivePattern = /effective\s+(?:from\s+)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
    const match = content.match(effectivePattern);
    return match ? match[1] : undefined;
  }

  private findExpiryDate(content: string, dates: string[]): string | undefined {
    const expiryPattern = /(?:expires?|valid\s+until|till)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
    const match = content.match(expiryPattern);
    return match ? match[1] : undefined;
  }

  private categorizeContent(content: string): string {
    const categories = {
      'Capital Adequacy': ['capital', 'adequacy', 'tier', 'leverage'],
      'Risk Management': ['risk', 'management', 'assessment', 'mitigation'],
      'KYC/AML': ['kyc', 'know your customer', 'aml', 'anti money laundering'],
      'Cyber Security': ['cyber', 'security', 'information', 'technology'],
      'Operational': ['operational', 'procedure', 'process', 'guideline'],
    };

    const contentLower = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private assessImpactLevel(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('immediate') || contentLower.includes('urgent') || 
        contentLower.includes('critical')) {
      return 'critical';
    }
    
    if (contentLower.includes('significant') || contentLower.includes('major') ||
        contentLower.includes('substantial')) {
      return 'high';
    }
    
    if (contentLower.includes('moderate') || contentLower.includes('important')) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractAffectedEntities(content: string): string[] {
    const entities = ['banks', 'nbfcs', 'financial institutions', 'cooperative banks'];
    const contentLower = content.toLowerCase();
    
    return entities.filter(entity => contentLower.includes(entity));
  }

  private extractSubCategory(content: string, category: string): string | undefined {
    // Simplified subcategory extraction
    return undefined;
  }

  private extractRequirements(content: string): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];
    const sentences = content.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();

      // Look for requirement indicators
      if (lowerSentence.includes('shall') || lowerSentence.includes('must') ||
          lowerSentence.includes('required to') || lowerSentence.includes('mandatory')) {

        requirements.push({
          id: `req_${index}`,
          title: sentence.substring(0, 100).trim(),
          description: sentence.trim(),
          category: this.categorizeRequirement(sentence),
          priority: this.assessRequirementPriority(sentence),
          applicableEntities: this.extractAffectedEntities(sentence),
        });
      }
    });

    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  private extractDeadlines(content: string): Deadline[] {
    const deadlines: Deadline[] = [];
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g;
    const deadlineKeywords = ['deadline', 'by', 'before', 'within', 'not later than'];

    const sentences = content.split(/[.!?]+/);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const hasDeadlineKeyword = deadlineKeywords.some(keyword =>
        lowerSentence.includes(keyword));

      if (hasDeadlineKeyword) {
        const dateMatch = sentence.match(datePattern);
        if (dateMatch) {
          deadlines.push({
            description: sentence.trim(),
            date: dateMatch[0],
            type: this.classifyDeadlineType(sentence),
            applicableEntities: this.extractAffectedEntities(sentence),
          });
        }
      }
    });

    return deadlines;
  }

  private extractReferences(content: string): Reference[] {
    const references: Reference[] = [];

    // Look for circular references
    const circularPattern = /(?:circular|notification)\s+(?:no\.?\s*)?([A-Z]+[\/\.\-]\d+[\/\.\-]\d+)/gi;
    let match;

    while ((match = circularPattern.exec(content)) !== null) {
      references.push({
        type: 'circular',
        title: match[0],
        number: match[1],
      });
    }

    // Look for act references
    const actPattern = /([\w\s]+)\s+Act,?\s*(\d{4})/gi;
    while ((match = actPattern.exec(content)) !== null) {
      references.push({
        type: 'act',
        title: `${match[1]} Act, ${match[2]}`,
        date: match[2],
      });
    }

    return references;
  }

  private extractDefinitions(content: string): Definition[] {
    const definitions: Definition[] = [];

    // Look for definition patterns
    const definitionPattern = /"([^"]+)"\s+means\s+([^.]+)/gi;
    let match;

    while ((match = definitionPattern.exec(content)) !== null) {
      definitions.push({
        term: match[1],
        definition: match[2],
        context: 'regulatory',
      });
    }

    return definitions;
  }

  private parseSections(content: string): ContentSection[] {
    const sections: ContentSection[] = [];

    // Simple section parsing based on numbered headings
    const sectionPattern = /(\d+\.?\s+[A-Z][^.]+)[\s\S]*?(?=\d+\.?\s+[A-Z]|$)/g;
    let match;

    while ((match = sectionPattern.exec(content)) !== null) {
      sections.push({
        title: match[1].trim(),
        content: match[0].trim(),
        importance: this.calculateSectionImportance(match[0]),
      });
    }

    return sections;
  }

  private getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private analyzeComplexity(content: string): any {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    let level: string;
    if (avgWordsPerSentence > 25) level = 'very_complex';
    else if (avgWordsPerSentence > 20) level = 'complex';
    else if (avgWordsPerSentence > 15) level = 'moderate';
    else level = 'simple';
    
    return { score: avgWordsPerSentence, level };
  }

  private analyzeUrgency(content: string): any {
    const urgentWords = ['immediate', 'urgent', 'asap', 'forthwith', 'without delay'];
    const contentLower = content.toLowerCase();
    
    const urgencyCount = urgentWords.reduce((count, word) => 
      count + (contentLower.split(word).length - 1), 0);
    
    let level: string;
    if (urgencyCount > 3) level = 'urgent';
    else if (urgencyCount > 1) level = 'high';
    else if (urgencyCount > 0) level = 'medium';
    else level = 'low';
    
    return { score: urgencyCount, level };
  }

  private extractTopics(content: string): string[] {
    // Simplified topic extraction
    return ['compliance', 'regulation'];
  }

  private extractNamedEntities(content: string): NamedEntity[] {
    // Simplified named entity recognition
    return [];
  }

  private extractKeywords(content: string): string[] {
    const doc = compromise(content);
    return doc.nouns().out('array').slice(0, 20);
  }

  private categorizeRequirement(sentence: string): string {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('capital') || lowerSentence.includes('adequacy')) {
      return 'Capital Adequacy';
    } else if (lowerSentence.includes('risk') || lowerSentence.includes('assessment')) {
      return 'Risk Management';
    } else if (lowerSentence.includes('report') || lowerSentence.includes('submission')) {
      return 'Reporting';
    } else if (lowerSentence.includes('kyc') || lowerSentence.includes('customer')) {
      return 'KYC/AML';
    }

    return 'General';
  }

  private assessRequirementPriority(sentence: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('immediate') || lowerSentence.includes('urgent')) {
      return 'critical';
    } else if (lowerSentence.includes('important') || lowerSentence.includes('significant')) {
      return 'high';
    } else if (lowerSentence.includes('should') || lowerSentence.includes('recommended')) {
      return 'medium';
    }

    return 'low';
  }

  private classifyDeadlineType(sentence: string): 'implementation' | 'compliance' | 'reporting' | 'submission' {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('implement') || lowerSentence.includes('establish')) {
      return 'implementation';
    } else if (lowerSentence.includes('report') || lowerSentence.includes('submit')) {
      return 'reporting';
    } else if (lowerSentence.includes('comply') || lowerSentence.includes('adherence')) {
      return 'compliance';
    }

    return 'submission';
  }

  private calculateSectionImportance(content: string): number {
    let importance = 0.5; // Base importance

    const importantKeywords = ['shall', 'must', 'required', 'mandatory', 'prohibited'];
    const lowerContent = content.toLowerCase();

    importantKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        importance += 0.1;
      }
    });

    return Math.min(importance, 1.0);
  }
}

export default CircularParserService;
