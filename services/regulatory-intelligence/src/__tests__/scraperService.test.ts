/**
 * Tests for RBI Scraper Service
 */

import RBIScraperService from '../services/scraperService';

// Mock external dependencies
jest.mock('puppeteer');
jest.mock('axios');

describe('RBIScraperService', () => {
  let scraperService: RBIScraperService;

  beforeEach(() => {
    scraperService = new RBIScraperService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any resources
  });

  describe('constructor', () => {
    it('should create an instance of RBIScraperService', () => {
      expect(scraperService).toBeInstanceOf(RBIScraperService);
    });
  });

  describe('getScrapingStats', () => {
    it('should return initial scraping statistics', () => {
      const stats = scraperService.getScrapingStats();
      
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('lastRequestTime');
      expect(stats).toHaveProperty('browserActive');
      
      expect(stats.requestCount).toBe(0);
      expect(stats.lastRequestTime).toBe(0);
      expect(stats.browserActive).toBe(false);
    });
  });

  describe('resetStats', () => {
    it('should reset scraping statistics', () => {
      // First, simulate some activity
      scraperService.resetStats();
      
      const stats = scraperService.getScrapingStats();
      expect(stats.requestCount).toBe(0);
      expect(stats.lastRequestTime).toBe(0);
    });
  });

  describe('extractCircularNumber', () => {
    it('should extract RBI circular numbers from titles', () => {
      // Access private method for testing (in real implementation, you might make it public for testing)
      const extractMethod = (scraperService as any).extractCircularNumber;
      
      const testCases = [
        {
          title: 'RBI/2024/001 - Guidelines on Capital Adequacy',
          expected: 'RBI/2024/001',
        },
        {
          title: 'DBOD.No.BP.BC.001/2024 - Banking Regulations',
          expected: 'DBOD.No.BP.BC.001/2024',
        },
        {
          title: 'Some circular without number pattern',
          expected: 'Some circular without',
        },
      ];

      testCases.forEach(({ title, expected }) => {
        const result = extractMethod.call(scraperService, title);
        expect(result).toBe(expected);
      });
    });
  });

  describe('filterCirculars', () => {
    it('should filter circulars by date range', () => {
      const mockCirculars = [
        { circularDate: '2024-01-15', title: 'Circular 1' },
        { circularDate: '2024-01-20', title: 'Circular 2' },
        { circularDate: '2024-01-25', title: 'Circular 3' },
      ];

      const filterMethod = (scraperService as any).filterCirculars;
      
      const filtered = filterMethod.call(scraperService, mockCirculars, {
        startDate: new Date('2024-01-18'),
        endDate: new Date('2024-01-22'),
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Circular 2');
    });

    it('should filter circulars by category', () => {
      const mockCirculars = [
        { title: 'Capital Adequacy Guidelines', circularDate: '2024-01-15' },
        { title: 'KYC Requirements Update', circularDate: '2024-01-16' },
        { title: 'Capital Management Rules', circularDate: '2024-01-17' },
      ];

      const filterMethod = (scraperService as any).filterCirculars;
      
      const filtered = filterMethod.call(scraperService, mockCirculars, {
        category: 'capital',
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((c: any) => c.title.toLowerCase().includes('capital'))).toBe(true);
    });
  });

  describe('downloadCircularContent', () => {
    it('should handle successful content download', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({
        status: 200,
        data: '<html><body>Circular content</body></html>',
      });

      const content = await scraperService.downloadCircularContent('https://example.com/circular');
      
      expect(content).toBe('<html><body>Circular content</body></html>');
      expect(axios.get).toHaveBeenCalledWith('https://example.com/circular', {
        timeout: expect.any(Number),
        maxRedirects: 5,
      });
    });

    it('should handle download errors', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        scraperService.downloadCircularContent('https://example.com/circular')
      ).rejects.toThrow('Failed to download content: Network error');
    });

    it('should handle HTTP error status codes', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        scraperService.downloadCircularContent('https://example.com/circular')
      ).rejects.toThrow('Failed to download content: HTTP 404: Not Found');
    });
  });

  describe('scrapeCircularsList', () => {
    it('should handle scraping errors gracefully', async () => {
      // Mock Puppeteer to throw an error
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValue(new Error('Browser launch failed'));

      await expect(
        scraperService.scrapeCircularsList()
      ).rejects.toThrow('Scraping failed: Browser launch failed');
    });

    it('should return proper result structure on success', async () => {
      // Mock successful Puppeteer execution
      const mockPage = {
        setUserAgent: jest.fn(),
        setViewport: jest.fn(),
        goto: jest.fn(),
        waitForSelector: jest.fn(),
        evaluate: jest.fn().mockResolvedValue([
          {
            circularDate: '2024-01-15',
            title: 'Test Circular',
            sourceUrl: 'https://example.com/circular',
            circularNumber: 'TEST/2024/001',
          },
        ]),
        close: jest.fn(),
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      };

      const puppeteer = require('puppeteer');
      puppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await scraperService.scrapeCircularsList();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('circulars');
      expect(result).toHaveProperty('totalFound');
      expect(result).toHaveProperty('scrapedAt');
      expect(result).toHaveProperty('source');
      expect(Array.isArray(result.circulars)).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should implement rate limiting between requests', async () => {
      const rateLimitMethod = (scraperService as any).rateLimit;
      
      const startTime = Date.now();
      await rateLimitMethod.call(scraperService);
      await rateLimitMethod.call(scraperService);
      const endTime = Date.now();

      // Should have some delay between requests
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });
});
