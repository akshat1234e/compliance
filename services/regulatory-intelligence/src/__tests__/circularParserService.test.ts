/**
 * Tests for Circular Parser Service
 */

import CircularParserService from '../services/circularParserService';

describe('CircularParserService', () => {
  let parserService: CircularParserService;

  beforeEach(() => {
    parserService = new CircularParserService();
  });

  describe('constructor', () => {
    it('should create an instance of CircularParserService', () => {
      expect(parserService).toBeInstanceOf(CircularParserService);
    });
  });

  describe('parseCircular', () => {
    const mockContent = `
      RBI/2024/001 - Guidelines on Capital Adequacy Framework
      
      This circular provides updated guidelines on capital adequacy framework for banks and NBFCs.
      
      Banks shall maintain a minimum capital adequacy ratio of 9% as per Basel III norms.
      The implementation deadline is 31st March 2024.
      
      All banks must submit quarterly reports on capital adequacy.
      
      This circular is effective from 1st April 2024.
    `;

    const mockMetadata = {
      circularNumber: 'RBI/2024/001',
      title: 'Guidelines on Capital Adequacy Framework',
      circularDate: '2024-01-15',
      sourceUrl: 'https://example.com/circular',
    };

    it('should parse circular content successfully', async () => {
      const result = await parserService.parseCircular(
        'test-circular-1',
        mockContent,
        mockMetadata
      );

      expect(result).toHaveProperty('circularId', 'test-circular-1');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('parsedAt');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should extract metadata correctly', async () => {
      const result = await parserService.parseCircular(
        'test-circular-2',
        mockContent,
        mockMetadata
      );

      expect(result.metadata.circularNumber).toBe('RBI/2024/001');
      expect(result.metadata.title).toBe('Guidelines on Capital Adequacy Framework');
      expect(result.metadata.category).toBe('Capital Adequacy');
      expect(result.metadata.impactLevel).toBeOneOf(['low', 'medium', 'high', 'critical']);
      expect(Array.isArray(result.metadata.affectedEntities)).toBe(true);
    });

    it('should extract content elements', async () => {
      const result = await parserService.parseCircular(
        'test-circular-3',
        mockContent,
        mockMetadata
      );

      expect(result.content).toHaveProperty('summary');
      expect(result.content).toHaveProperty('keyPoints');
      expect(result.content).toHaveProperty('requirements');
      expect(result.content).toHaveProperty('deadlines');
      expect(result.content).toHaveProperty('references');
      expect(result.content).toHaveProperty('definitions');
      expect(result.content).toHaveProperty('sections');

      expect(typeof result.content.summary).toBe('string');
      expect(Array.isArray(result.content.keyPoints)).toBe(true);
      expect(Array.isArray(result.content.requirements)).toBe(true);
      expect(Array.isArray(result.content.deadlines)).toBe(true);
    });

    it('should perform content analysis', async () => {
      const result = await parserService.parseCircular(
        'test-circular-4',
        mockContent,
        mockMetadata
      );

      expect(result.analysis).toHaveProperty('sentiment');
      expect(result.analysis).toHaveProperty('complexity');
      expect(result.analysis).toHaveProperty('urgency');
      expect(result.analysis).toHaveProperty('topics');
      expect(result.analysis).toHaveProperty('entities');
      expect(result.analysis).toHaveProperty('keywords');

      expect(result.analysis.sentiment).toHaveProperty('score');
      expect(result.analysis.sentiment).toHaveProperty('label');
      expect(['positive', 'neutral', 'negative']).toContain(result.analysis.sentiment.label);

      expect(result.analysis.complexity).toHaveProperty('score');
      expect(result.analysis.complexity).toHaveProperty('level');
      expect(['simple', 'moderate', 'complex', 'very_complex']).toContain(result.analysis.complexity.level);
    });

    it('should handle empty content gracefully', async () => {
      const result = await parserService.parseCircular(
        'test-circular-empty',
        '',
        {}
      );

      expect(result.confidence).toBeLessThan(0.7);
      expect(result.content.summary).toBe('');
      expect(result.content.keyPoints).toHaveLength(0);
    });

    it('should handle minimal metadata', async () => {
      const result = await parserService.parseCircular(
        'test-circular-minimal',
        mockContent,
        {}
      );

      expect(result.metadata.circularNumber).toBe('UNKNOWN');
      expect(result.metadata.title).toBe('Untitled Circular');
      expect(result.metadata.category).toBeTruthy();
    });
  });

  describe('content preprocessing', () => {
    it('should clean HTML tags from content', () => {
      const htmlContent = '<p>This is a <strong>test</strong> circular.</p>';
      const preprocessMethod = (parserService as any).preprocessContent;
      const cleaned = preprocessMethod.call(parserService, htmlContent);
      
      expect(cleaned).not.toContain('<p>');
      expect(cleaned).not.toContain('<strong>');
      expect(cleaned).toContain('This is a test circular.');
    });

    it('should normalize whitespace', () => {
      const messyContent = 'This   is    a\n\n\ntest   circular.';
      const preprocessMethod = (parserService as any).preprocessContent;
      const cleaned = preprocessMethod.call(parserService, messyContent);
      
      expect(cleaned).toBe('This is a test circular.');
    });

    it('should expand common abbreviations', () => {
      const abbreviatedContent = 'RBI issued new KYC and AML guidelines for NBFCs.';
      const preprocessMethod = (parserService as any).preprocessContent;
      const cleaned = preprocessMethod.call(parserService, abbreviatedContent);
      
      expect(cleaned).toContain('Reserve Bank of India');
      expect(cleaned).toContain('Know Your Customer');
      expect(cleaned).toContain('Anti Money Laundering');
      expect(cleaned).toContain('Non-Banking Financial Company');
    });
  });

  describe('categorization', () => {
    it('should categorize capital adequacy content correctly', () => {
      const content = 'Banks must maintain capital adequacy ratio and tier 1 capital.';
      const categorizeMethod = (parserService as any).categorizeContent;
      const category = categorizeMethod.call(parserService, content);
      
      expect(category).toBe('Capital Adequacy');
    });

    it('should categorize risk management content correctly', () => {
      const content = 'Risk assessment and risk management procedures must be followed.';
      const categorizeMethod = (parserService as any).categorizeContent;
      const category = categorizeMethod.call(parserService, content);
      
      expect(category).toBe('Risk Management');
    });

    it('should categorize KYC/AML content correctly', () => {
      const content = 'Know your customer and anti money laundering guidelines.';
      const categorizeMethod = (parserService as any).categorizeContent;
      const category = categorizeMethod.call(parserService, content);
      
      expect(category).toBe('KYC/AML');
    });

    it('should default to General for unrecognized content', () => {
      const content = 'This is some random content without specific keywords.';
      const categorizeMethod = (parserService as any).categorizeContent;
      const category = categorizeMethod.call(parserService, content);
      
      expect(category).toBe('General');
    });
  });

  describe('impact level assessment', () => {
    it('should assess critical impact for urgent content', () => {
      const content = 'Immediate action required. This is urgent and critical.';
      const assessMethod = (parserService as any).assessImpactLevel;
      const impact = assessMethod.call(parserService, content);
      
      expect(impact).toBe('critical');
    });

    it('should assess high impact for significant content', () => {
      const content = 'This is a significant change with major implications.';
      const assessMethod = (parserService as any).assessImpactLevel;
      const impact = assessMethod.call(parserService, content);
      
      expect(impact).toBe('high');
    });

    it('should assess medium impact for moderate content', () => {
      const content = 'This is a moderate change that is important to note.';
      const assessMethod = (parserService as any).assessImpactLevel;
      const impact = assessMethod.call(parserService, content);
      
      expect(impact).toBe('medium');
    });

    it('should assess low impact for general content', () => {
      const content = 'This is a general informational circular.';
      const assessMethod = (parserService as any).assessImpactLevel;
      const impact = assessMethod.call(parserService, content);
      
      expect(impact).toBe('low');
    });
  });

  describe('entity extraction', () => {
    it('should extract affected entities from content', () => {
      const content = 'All banks and NBFCs must comply. Financial institutions are affected.';
      const extractMethod = (parserService as any).extractAffectedEntities;
      const entities = extractMethod.call(parserService, content);
      
      expect(entities).toContain('banks');
      expect(entities).toContain('nbfcs');
      expect(entities).toContain('financial institutions');
    });

    it('should return empty array for content without entities', () => {
      const content = 'This content has no specific entity mentions.';
      const extractMethod = (parserService as any).extractAffectedEntities;
      const entities = extractMethod.call(parserService, content);
      
      expect(entities).toHaveLength(0);
    });
  });

  describe('confidence calculation', () => {
    it('should calculate higher confidence for rich content', () => {
      const richContent = {
        summary: 'This is a comprehensive summary of the circular content.',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        requirements: [{ id: '1', title: 'Req 1', description: 'Description', category: 'Test', priority: 'high', applicableEntities: [] }],
        deadlines: [{ description: 'Deadline 1', date: '2024-12-31', type: 'implementation', applicableEntities: [] }],
        references: [{ type: 'circular', title: 'Ref 1' }],
        definitions: [],
        sections: [],
      };

      const richAnalysis = {
        sentiment: { score: 0, label: 'neutral' },
        complexity: { score: 15, level: 'moderate' },
        urgency: { score: 1, level: 'medium' },
        topics: ['compliance'],
        entities: [{ text: 'RBI', type: 'ORGANIZATION', confidence: 0.9 }],
        keywords: ['compliance', 'regulation', 'guideline', 'requirement', 'deadline', 'bank'],
      };

      const calculateMethod = (parserService as any).calculateConfidence;
      const confidence = calculateMethod.call(parserService, richContent, richAnalysis);
      
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should calculate lower confidence for sparse content', () => {
      const sparseContent = {
        summary: '',
        keyPoints: [],
        requirements: [],
        deadlines: [],
        references: [],
        definitions: [],
        sections: [],
      };

      const sparseAnalysis = {
        sentiment: { score: 0, label: 'neutral' },
        complexity: { score: 10, level: 'simple' },
        urgency: { score: 0, level: 'low' },
        topics: [],
        entities: [],
        keywords: [],
      };

      const calculateMethod = (parserService as any).calculateConfidence;
      const confidence = calculateMethod.call(parserService, sparseContent, sparseAnalysis);
      
      expect(confidence).toBeLessThan(0.7);
    });
  });
});
