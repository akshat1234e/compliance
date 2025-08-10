/**
 * RBI Circular Scraper Service
 * Handles web scraping of RBI circulars from official website
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '@config/index';
import { logger, loggers } from '@utils/logger';
import { CustomError } from '@middleware/errorHandler';

export interface CircularMetadata {
  circularNumber: string;
  title: string;
  circularDate: string;
  category?: string;
  subCategory?: string;
  sourceUrl: string;
  downloadUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export interface ScrapingResult {
  success: boolean;
  circulars: CircularMetadata[];
  totalFound: number;
  scrapedAt: string;
  source: string;
  errors?: string[];
}

export interface ScrapingOptions {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  maxPages?: number;
  includeContent?: boolean;
  downloadFiles?: boolean;
}

export class RBIScraperService {
  private browser: Browser | null = null;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    this.setupAxiosDefaults();
  }

  private setupAxiosDefaults(): void {
    axios.defaults.timeout = config.scraping.timeout;
    axios.defaults.headers.common['User-Agent'] = config.scraping.userAgent;
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });

      logger.info('Puppeteer browser initialized');
      return this.browser;
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser', { error: (error as Error).message });
      throw new CustomError('Browser initialization failed', 500);
    }
  }

  /**
   * Close Puppeteer browser
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  /**
   * Rate limiting for requests
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < config.scraping.requestDelay) {
      const waitTime = config.scraping.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Scrape RBI circulars from the main listing page
   */
  public async scrapeCircularsList(options: ScrapingOptions = {}): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      success: false,
      circulars: [],
      totalFound: 0,
      scrapedAt: new Date().toISOString(),
      source: 'RBI Official Website',
      errors: [],
    };

    try {
      loggers.scraping(config.externalServices.rbi.circularsUrl, 'started', options);

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set user agent and viewport
      await page.setUserAgent(config.scraping.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to RBI circulars page
      await this.rateLimit();
      await page.goto(config.externalServices.rbi.circularsUrl, {
        waitUntil: 'networkidle2',
        timeout: config.scraping.timeout,
      });

      // Wait for the page to load completely
      await page.waitForSelector('table', { timeout: 10000 });

      // Extract circulars data
      const circulars = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        const extractedCirculars: any[] = [];

        rows.forEach((row, index) => {
          // Skip header row
          if (index === 0) return;

          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const dateCell = cells[0]?.textContent?.trim();
            const titleCell = cells[1];
            const linkElement = titleCell?.querySelector('a');

            if (dateCell && titleCell && linkElement) {
              const title = titleCell.textContent?.trim();
              const href = linkElement.getAttribute('href');
              
              if (title && href) {
                extractedCirculars.push({
                  circularDate: dateCell,
                  title: title,
                  sourceUrl: href.startsWith('http') ? href : `https://www.rbi.org.in${href}`,
                  circularNumber: this.extractCircularNumber(title),
                });
              }
            }
          }
        });

        return extractedCirculars;
      });

      // Filter circulars based on options
      const filteredCirculars = this.filterCirculars(circulars, options);

      // Enhance circular metadata
      const enhancedCirculars = await this.enhanceCircularMetadata(filteredCirculars, page);

      result.circulars = enhancedCirculars;
      result.totalFound = enhancedCirculars.length;
      result.success = true;

      await page.close();

      const duration = Date.now() - startTime;
      loggers.scraping(config.externalServices.rbi.circularsUrl, 'completed', {
        totalFound: result.totalFound,
        duration: `${duration}ms`,
      });

      return result;

    } catch (error) {
      const errorMessage = (error as Error).message;
      result.errors = [errorMessage];
      
      loggers.scraping(config.externalServices.rbi.circularsUrl, 'failed', options, error as Error);
      
      throw new CustomError(`Scraping failed: ${errorMessage}`, 500);
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Extract circular number from title
   */
  private extractCircularNumber(title: string): string {
    // Common patterns for RBI circular numbers
    const patterns = [
      /RBI\/\d{4}\/\d+/i,
      /DBOD\.No\.[A-Z]+\.\d+\/\d+/i,
      /DPSS\.No\.\d+\/\d+/i,
      /FIDD\.No\.[A-Z]+\.\d+\/\d+/i,
      /FMRD\.No\.[A-Z]+\.\d+\/\d+/i,
      /IDMD\.No\.[A-Z]+\.\d+\/\d+/i,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Fallback: use first part of title
    return title.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Filter circulars based on options
   */
  private filterCirculars(circulars: any[], options: ScrapingOptions): any[] {
    let filtered = [...circulars];

    // Filter by date range
    if (options.startDate || options.endDate) {
      filtered = filtered.filter(circular => {
        const circularDate = new Date(circular.circularDate);
        
        if (options.startDate && circularDate < options.startDate) {
          return false;
        }
        
        if (options.endDate && circularDate > options.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Filter by category (if specified in title)
    if (options.category) {
      const categoryLower = options.category.toLowerCase();
      filtered = filtered.filter(circular => 
        circular.title.toLowerCase().includes(categoryLower)
      );
    }

    return filtered;
  }

  /**
   * Enhance circular metadata by visiting individual pages
   */
  private async enhanceCircularMetadata(circulars: any[], page: Page): Promise<CircularMetadata[]> {
    const enhanced: CircularMetadata[] = [];
    const maxToEnhance = Math.min(circulars.length, 10); // Limit to avoid overwhelming

    for (let i = 0; i < maxToEnhance; i++) {
      const circular = circulars[i];
      
      try {
        await this.rateLimit();
        
        // Visit the circular page to get more details
        await page.goto(circular.sourceUrl, {
          waitUntil: 'networkidle2',
          timeout: config.scraping.timeout,
        });

        // Extract additional metadata
        const metadata = await page.evaluate(() => {
          const content = document.body.textContent || '';
          
          // Try to find download links
          const downloadLinks = Array.from(document.querySelectorAll('a[href*=".pdf"], a[href*=".doc"], a[href*=".docx"]'));
          const downloadUrl = downloadLinks.length > 0 ? 
            (downloadLinks[0] as HTMLAnchorElement).href : undefined;

          // Determine category from content
          let category = 'General';
          if (content.includes('capital adequacy') || content.includes('Capital Adequacy')) {
            category = 'Capital Adequacy';
          } else if (content.includes('KYC') || content.includes('Know Your Customer')) {
            category = 'KYC/AML';
          } else if (content.includes('risk management') || content.includes('Risk Management')) {
            category = 'Risk Management';
          } else if (content.includes('cyber security') || content.includes('Cyber Security')) {
            category = 'Cyber Security';
          }

          return {
            category,
            downloadUrl,
            fileType: downloadUrl ? downloadUrl.split('.').pop()?.toUpperCase() : undefined,
          };
        });

        enhanced.push({
          circularNumber: circular.circularNumber,
          title: circular.title,
          circularDate: circular.circularDate,
          category: metadata.category,
          sourceUrl: circular.sourceUrl,
          downloadUrl: metadata.downloadUrl,
          fileType: metadata.fileType,
        });

      } catch (error) {
        logger.warn('Failed to enhance circular metadata', {
          circularUrl: circular.sourceUrl,
          error: (error as Error).message,
        });

        // Add basic metadata even if enhancement fails
        enhanced.push({
          circularNumber: circular.circularNumber,
          title: circular.title,
          circularDate: circular.circularDate,
          sourceUrl: circular.sourceUrl,
        });
      }
    }

    return enhanced;
  }

  /**
   * Download circular content
   */
  public async downloadCircularContent(url: string): Promise<string> {
    try {
      await this.rateLimit();
      
      const response: AxiosResponse = await axios.get(url, {
        timeout: config.scraping.timeout,
        maxRedirects: 5,
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      loggers.externalApi('RBI', url, 'GET', undefined, undefined, error as Error);
      throw new CustomError(`Failed to download content: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get scraping statistics
   */
  public getScrapingStats(): any {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      browserActive: this.browser !== null,
    };
  }

  /**
   * Reset scraping statistics
   */
  public resetStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

export default RBIScraperService;
