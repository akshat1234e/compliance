/**
 * Regulatory Monitor Service
 * Monitors RBI, SEBI, IRDAI and other regulatory websites for new circulars and notifications
 */

import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import cron from 'node-cron';
import { EventEmitter } from 'events';

import { logger } from '../utils/logger';
import { config } from '../config';
import { CircularProcessor } from './CircularProcessor';
import { NotificationService } from './NotificationService';
import { DatabaseService } from '../database/DatabaseService';
import { RegulatorySource, CircularDocument, MonitoringResult } from '../types/regulatory';

export class RegulatoryMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private browser: puppeteer.Browser | null = null;
  private circularProcessor: CircularProcessor;
  private notificationService: NotificationService;
  private databaseService: DatabaseService;
  private monitoringJobs: Map<string, cron.ScheduledTask> = new Map();

  private regulatorySources: RegulatorySource[] = [
    {
      id: 'rbi',
      name: 'Reserve Bank of India',
      baseUrl: 'https://www.rbi.org.in',
      circularsUrl: 'https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx',
      notificationsUrl: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
      selectors: {
        circularList: '.tablebg tr',
        circularTitle: 'td:nth-child(2) a',
        circularDate: 'td:nth-child(1)',
        circularLink: 'td:nth-child(2) a',
        circularNumber: 'td:nth-child(3)'
      },
      schedule: '0 */30 * * * *', // Every 30 minutes
      enabled: true
    },
    {
      id: 'sebi',
      name: 'Securities and Exchange Board of India',
      baseUrl: 'https://www.sebi.gov.in',
      circularsUrl: 'https://www.sebi.gov.in/legal/circulars',
      notificationsUrl: 'https://www.sebi.gov.in/legal/notifications',
      selectors: {
        circularList: '.views-row',
        circularTitle: '.views-field-title a',
        circularDate: '.views-field-field-date',
        circularLink: '.views-field-title a',
        circularNumber: '.views-field-field-circular-no'
      },
      schedule: '0 */45 * * * *', // Every 45 minutes
      enabled: true
    },
    {
      id: 'irdai',
      name: 'Insurance Regulatory and Development Authority of India',
      baseUrl: 'https://www.irdai.gov.in',
      circularsUrl: 'https://www.irdai.gov.in/ADMINCMS/cms/NormalData_Layout.aspx?page=PageNo234',
      notificationsUrl: 'https://www.irdai.gov.in/ADMINCMS/cms/NormalData_Layout.aspx?page=PageNo233',
      selectors: {
        circularList: '.GridRow, .GridAlternateRow',
        circularTitle: 'td:nth-child(2)',
        circularDate: 'td:nth-child(3)',
        circularLink: 'td:nth-child(2) a',
        circularNumber: 'td:nth-child(1)'
      },
      schedule: '0 0 */2 * * *', // Every 2 hours
      enabled: true
    }
  ];

  constructor() {
    super();
    this.circularProcessor = new CircularProcessor();
    this.notificationService = new NotificationService();
    this.databaseService = new DatabaseService();
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Regulatory Monitor...');

      // Initialize Puppeteer browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      // Initialize services
      await this.circularProcessor.initialize();
      await this.notificationService.initialize();

      logger.info('✅ Regulatory Monitor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Regulatory Monitor:', error);
      throw error;
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('Monitoring is already active');
      return;
    }

    logger.info('Starting regulatory monitoring...');
    this.isMonitoring = true;

    // Schedule monitoring jobs for each regulatory source
    this.regulatorySources.forEach(source => {
      if (source.enabled) {
        const job = cron.schedule(source.schedule, async () => {
          await this.monitorSource(source);
        }, {
          scheduled: false,
          timezone: 'Asia/Kolkata'
        });

        job.start();
        this.monitoringJobs.set(source.id, job);
        
        logger.info(`📅 Scheduled monitoring for ${source.name} (${source.schedule})`);
      }
    });

    // Run initial scan for all sources
    this.performInitialScan();

    logger.info('✅ Regulatory monitoring started');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.warn('Monitoring is not active');
      return;
    }

    logger.info('Stopping regulatory monitoring...');
    this.isMonitoring = false;

    // Stop all scheduled jobs
    this.monitoringJobs.forEach((job, sourceId) => {
      job.stop();
      logger.info(`⏹️ Stopped monitoring for ${sourceId}`);
    });

    this.monitoringJobs.clear();
    logger.info('✅ Regulatory monitoring stopped');
  }

  private async performInitialScan(): Promise<void> {
    logger.info('Performing initial scan of all regulatory sources...');

    for (const source of this.regulatorySources) {
      if (source.enabled) {
        try {
          await this.monitorSource(source);
          // Add delay between sources to avoid overwhelming servers
          await this.delay(5000);
        } catch (error) {
          logger.error(`Failed initial scan for ${source.name}:`, error);
        }
      }
    }

    logger.info('✅ Initial scan completed');
  }

  private async monitorSource(source: RegulatorySource): Promise<MonitoringResult> {
    const startTime = Date.now();
    logger.info(`🔍 Monitoring ${source.name}...`);

    try {
      // Get latest circulars from the source
      const circulars = await this.scrapeCirculars(source);
      
      // Filter new circulars (not already in database)
      const newCirculars = await this.filterNewCirculars(circulars, source.id);
      
      if (newCirculars.length > 0) {
        logger.info(`📄 Found ${newCirculars.length} new circulars from ${source.name}`);
        
        // Process each new circular
        for (const circular of newCirculars) {
          try {
            await this.processNewCircular(circular, source);
          } catch (error) {
            logger.error(`Failed to process circular ${circular.number}:`, error);
          }
        }

        // Send notifications for new circulars
        await this.notificationService.sendNewCircularsNotification(newCirculars, source);
      } else {
        logger.info(`✅ No new circulars found for ${source.name}`);
      }

      const duration = Date.now() - startTime;
      const result: MonitoringResult = {
        sourceId: source.id,
        sourceName: source.name,
        totalCirculars: circulars.length,
        newCirculars: newCirculars.length,
        duration,
        success: true,
        timestamp: new Date()
      };

      // Emit monitoring result event
      this.emit('monitoringResult', result);

      return result;

    } catch (error) {
      logger.error(`❌ Failed to monitor ${source.name}:`, error);
      
      const duration = Date.now() - startTime;
      const result: MonitoringResult = {
        sourceId: source.id,
        sourceName: source.name,
        totalCirculars: 0,
        newCirculars: 0,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date()
      };

      this.emit('monitoringError', result);
      return result;
    }
  }

  private async scrapeCirculars(source: RegulatorySource): Promise<CircularDocument[]> {
    const circulars: CircularDocument[] = [];

    try {
      if (source.id === 'rbi') {
        return await this.scrapeRBICirculars(source);
      } else if (source.id === 'sebi') {
        return await this.scrapeSEBICirculars(source);
      } else if (source.id === 'irdai') {
        return await this.scrapeIRDAICirculars(source);
      }

      return circulars;
    } catch (error) {
      logger.error(`Failed to scrape circulars from ${source.name}:`, error);
      throw error;
    }
  }

  private async scrapeRBICirculars(source: RegulatorySource): Promise<CircularDocument[]> {
    const circulars: CircularDocument[] = [];
    
    try {
      const response = await axios.get(source.circularsUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      $(source.selectors.circularList).each((index, element) => {
        try {
          const $row = $(element);
          const title = $row.find(source.selectors.circularTitle).text().trim();
          const dateText = $row.find(source.selectors.circularDate).text().trim();
          const link = $row.find(source.selectors.circularLink).attr('href');
          const number = $row.find(source.selectors.circularNumber).text().trim();

          if (title && link && dateText) {
            const fullUrl = link.startsWith('http') ? link : `${source.baseUrl}${link}`;
            
            circulars.push({
              id: `${source.id}_${number || index}`,
              title,
              number: number || `${source.id}_${index}`,
              date: this.parseDate(dateText),
              url: fullUrl,
              sourceId: source.id,
              sourceName: source.name,
              type: 'circular',
              status: 'new',
              content: '',
              summary: '',
              tags: [],
              impact: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (error) {
          logger.warn(`Failed to parse circular row ${index}:`, error);
        }
      });

      logger.info(`📄 Scraped ${circulars.length} circulars from RBI`);
      return circulars;

    } catch (error) {
      logger.error('Failed to scrape RBI circulars:', error);
      throw error;
    }
  }

  private async scrapeSEBICirculars(source: RegulatorySource): Promise<CircularDocument[]> {
    const circulars: CircularDocument[] = [];
    
    try {
      // SEBI requires JavaScript rendering, use Puppeteer
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto(source.circularsUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const circularData = await page.evaluate((selectors) => {
        const items = [];
        const rows = document.querySelectorAll(selectors.circularList);
        
        rows.forEach((row, index) => {
          const titleElement = row.querySelector(selectors.circularTitle);
          const dateElement = row.querySelector(selectors.circularDate);
          const numberElement = row.querySelector(selectors.circularNumber);
          
          if (titleElement && dateElement) {
            items.push({
              title: titleElement.textContent?.trim() || '',
              date: dateElement.textContent?.trim() || '',
              url: titleElement.getAttribute('href') || '',
              number: numberElement?.textContent?.trim() || `sebi_${index}`
            });
          }
        });
        
        return items;
      }, source.selectors);

      await page.close();

      circularData.forEach((item, index) => {
        if (item.title && item.url) {
          const fullUrl = item.url.startsWith('http') ? item.url : `${source.baseUrl}${item.url}`;
          
          circulars.push({
            id: `${source.id}_${item.number}`,
            title: item.title,
            number: item.number,
            date: this.parseDate(item.date),
            url: fullUrl,
            sourceId: source.id,
            sourceName: source.name,
            type: 'circular',
            status: 'new',
            content: '',
            summary: '',
            tags: [],
            impact: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });

      logger.info(`📄 Scraped ${circulars.length} circulars from SEBI`);
      return circulars;

    } catch (error) {
      logger.error('Failed to scrape SEBI circulars:', error);
      throw error;
    }
  }

  private async scrapeIRDAICirculars(source: RegulatorySource): Promise<CircularDocument[]> {
    const circulars: CircularDocument[] = [];
    
    try {
      const response = await axios.get(source.circularsUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      $(source.selectors.circularList).each((index, element) => {
        try {
          const $row = $(element);
          const title = $row.find(source.selectors.circularTitle).text().trim();
          const dateText = $row.find(source.selectors.circularDate).text().trim();
          const link = $row.find(source.selectors.circularLink).attr('href');
          const number = $row.find(source.selectors.circularNumber).text().trim();

          if (title && link && dateText) {
            const fullUrl = link.startsWith('http') ? link : `${source.baseUrl}${link}`;
            
            circulars.push({
              id: `${source.id}_${number || index}`,
              title,
              number: number || `${source.id}_${index}`,
              date: this.parseDate(dateText),
              url: fullUrl,
              sourceId: source.id,
              sourceName: source.name,
              type: 'circular',
              status: 'new',
              content: '',
              summary: '',
              tags: [],
              impact: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (error) {
          logger.warn(`Failed to parse IRDAI circular row ${index}:`, error);
        }
      });

      logger.info(`📄 Scraped ${circulars.length} circulars from IRDAI`);
      return circulars;

    } catch (error) {
      logger.error('Failed to scrape IRDAI circulars:', error);
      throw error;
    }
  }

  private async filterNewCirculars(circulars: CircularDocument[], sourceId: string): Promise<CircularDocument[]> {
    try {
      // Get existing circular numbers from database
      const existingNumbers = await this.databaseService.getExistingCircularNumbers(sourceId);
      
      // Filter out circulars that already exist
      const newCirculars = circulars.filter(circular => 
        !existingNumbers.includes(circular.number)
      );

      return newCirculars;
    } catch (error) {
      logger.error('Failed to filter new circulars:', error);
      // Return all circulars if filtering fails
      return circulars;
    }
  }

  private async processNewCircular(circular: CircularDocument, source: RegulatorySource): Promise<void> {
    try {
      // Download and process the circular content
      const processedCircular = await this.circularProcessor.processCircular(circular);
      
      // Save to database
      await this.databaseService.saveCircular(processedCircular);
      
      // Emit new circular event
      this.emit('newCircular', processedCircular);
      
      logger.info(`✅ Processed new circular: ${circular.number} - ${circular.title}`);
    } catch (error) {
      logger.error(`Failed to process circular ${circular.number}:`, error);
      throw error;
    }
  }

  private parseDate(dateString: string): Date {
    try {
      // Handle various date formats used by different regulators
      const cleanDate = dateString.replace(/\s+/g, ' ').trim();
      
      // Try different date formats
      const formats = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
        /(\d{1,2})\s+(\w+)\s+(\d{4})/,          // DD Month YYYY
      ];

      for (const format of formats) {
        const match = cleanDate.match(format);
        if (match) {
          if (format === formats[0]) {
            // DD/MM/YYYY
            return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          } else if (format === formats[1]) {
            // YYYY/MM/DD
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else if (format === formats[2]) {
            // DD Month YYYY
            return new Date(`${match[1]} ${match[2]} ${match[3]}`);
          }
        }
      }

      // Fallback to current date if parsing fails
      logger.warn(`Failed to parse date: ${dateString}, using current date`);
      return new Date();
    } catch (error) {
      logger.warn(`Date parsing error for "${dateString}":`, error);
      return new Date();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async stop(): Promise<void> {
    try {
      this.stopMonitoring();
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      logger.info('✅ Regulatory Monitor stopped');
    } catch (error) {
      logger.error('Error stopping Regulatory Monitor:', error);
    }
  }

  public getMonitoringStatus(): any {
    return {
      isMonitoring: this.isMonitoring,
      activeSources: this.monitoringJobs.size,
      sources: this.regulatorySources.map(source => ({
        id: source.id,
        name: source.name,
        enabled: source.enabled,
        schedule: source.schedule,
        isActive: this.monitoringJobs.has(source.id)
      }))
    };
  }
}
