/**
 * Document Processor
 * Core document processing engine with OCR, classification, and metadata extraction
 */

import { config } from '@config/index';
import {
    DocumentType,
    ProcessingOptions,
    ProcessingResult,
    ProcessingStatus
} from '@types/document';
import { logger } from '@utils/logger';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';
import { ClassificationService } from '../services/ClassificationService';
import { OCRService } from '../services/OCRService';
import { SearchService } from '../services/SearchService';
import { ThumbnailService } from '../services/ThumbnailService';
import { VersioningService } from '../services/VersioningService';
import { StorageManager } from '../storage/StorageManager';

export class DocumentProcessor extends EventEmitter {
  private isInitialized = false;
  private tesseractWorker?: Tesseract.Worker;
  private processingQueue: Map<string, ProcessingResult> = new Map();

  // Integrated services
  private ocrService: OCRService;
  private classificationService: ClassificationService;
  private searchService: SearchService;
  private thumbnailService: ThumbnailService;
  private versioningService: VersioningService;
  private storageManager: StorageManager;

  constructor() {
    super();

    // Initialize services
    this.ocrService = new OCRService();
    this.classificationService = new ClassificationService();
    this.searchService = new SearchService();
    this.thumbnailService = new ThumbnailService();
    this.versioningService = new VersioningService();
    this.storageManager = new StorageManager();
  }

  /**
   * Initialize the document processor
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Document processor already initialized');
      return;
    }

    try {
      logger.info('Initializing Document Processor...');

      // Initialize all services
      await Promise.all([
        this.storageManager.initialize(),
        this.ocrService.initialize(),
        this.classificationService.initialize(),
        this.searchService.initialize(),
        this.thumbnailService.initialize(),
        this.versioningService.initialize(),
      ]);

      // Initialize OCR worker if enabled (legacy support)
      if (config.processing.enableOCR) {
        await this.initializeOCR();
      }

      // Create necessary directories
      await this.createDirectories();

      this.isInitialized = true;
      logger.info('Document Processor initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Document Processor', error);
      throw error;
    }
  }

  /**
   * Process a document
   */
  public async processDocument(
    filePath: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    try {
      logger.info('Starting document processing', {
        processingId,
        filePath,
        options,
      });

      // Initialize processing result
      const result: ProcessingResult = {
        id: processingId,
        status: ProcessingStatus.PROCESSING,
        startedAt: new Date(),
        filePath,
        metadata: {},
        extractedText: '',
        thumbnails: [],
        classifications: [],
        errors: [],
      };

      this.processingQueue.set(processingId, result);
      this.emit('processingStarted', result);

      // Get file information
      const fileStats = await fs.stat(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);

      // Extract basic metadata
      result.metadata = {
        fileName,
        fileSize: fileStats.size,
        fileType: this.getDocumentType(fileExtension),
        mimeType: this.getMimeType(fileExtension),
        createdAt: fileStats.birthtime,
        modifiedAt: fileStats.mtime,
        extension: fileExtension,
      };

      // Process based on file type
      switch (result.metadata.fileType) {
        case DocumentType.PDF:
          await this.processPDF(filePath, result, options);
          break;
        case DocumentType.WORD:
          await this.processWord(filePath, result, options);
          break;
        case DocumentType.EXCEL:
          await this.processExcel(filePath, result, options);
          break;
        case DocumentType.IMAGE:
          await this.processImage(filePath, result, options);
          break;
        case DocumentType.TEXT:
          await this.processText(filePath, result, options);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Generate thumbnails if enabled
      if (config.processing.enableThumbnails && options.generateThumbnails !== false) {
        await this.generateThumbnails(filePath, result);
      }

      // Classify document if enabled
      if (config.processing.enableClassification && options.classify !== false) {
        await this.classifyDocument(result);
      }

      // Complete processing
      result.status = ProcessingStatus.COMPLETED;
      result.completedAt = new Date();
      result.processingTime = Date.now() - startTime;

      logger.info('Document processing completed', {
        processingId,
        processingTime: result.processingTime,
        extractedTextLength: result.extractedText.length,
        thumbnailsGenerated: result.thumbnails.length,
      });

      this.emit('processingCompleted', result);
      return result;
    } catch (error) {
      const result = this.processingQueue.get(processingId);
      if (result) {
        result.status = ProcessingStatus.FAILED;
        result.completedAt = new Date();
        result.processingTime = Date.now() - startTime;
        result.errors.push({
          message: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: new Date(),
        });
      }

      logger.error('Document processing failed', {
        processingId,
        error: (error as Error).message,
        filePath,
      });

      this.emit('processingFailed', result, error);
      throw error;
    }
  }

  /**
   * Process PDF document
   */
  private async processPDF(
    filePath: string,
    result: ProcessingResult,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      const buffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(buffer);

      result.extractedText = pdfData.text;
      result.metadata.pageCount = pdfData.numpages;
      result.metadata.title = pdfData.info?.Title;
      result.metadata.author = pdfData.info?.Author;
      result.metadata.subject = pdfData.info?.Subject;
      result.metadata.creator = pdfData.info?.Creator;
      result.metadata.producer = pdfData.info?.Producer;
      result.metadata.creationDate = pdfData.info?.CreationDate;

      logger.debug('PDF processed', {
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
      });
    } catch (error) {
      logger.error('Failed to process PDF', error);
      throw error;
    }
  }

  /**
   * Process Word document
   */
  private async processWord(
    filePath: string,
    result: ProcessingResult,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      const buffer = await fs.readFile(filePath);
      const wordResult = await mammoth.extractRawText({ buffer });

      result.extractedText = wordResult.value;

      if (wordResult.messages.length > 0) {
        result.warnings = wordResult.messages.map(msg => ({
          message: msg.message,
          type: msg.type,
        }));
      }

      logger.debug('Word document processed', {
        textLength: wordResult.value.length,
        warnings: wordResult.messages.length,
      });
    } catch (error) {
      logger.error('Failed to process Word document', error);
      throw error;
    }
  }

  /**
   * Process Excel document
   */
  private async processExcel(
    filePath: string,
    result: ProcessingResult,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      let extractedText = '';

      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        extractedText += `Sheet: ${sheetName}\n${csvData}\n\n`;
      }

      result.extractedText = extractedText;
      result.metadata.sheetCount = sheetNames.length;
      result.metadata.sheetNames = sheetNames;

      logger.debug('Excel document processed', {
        sheets: sheetNames.length,
        textLength: extractedText.length,
      });
    } catch (error) {
      logger.error('Failed to process Excel document', error);
      throw error;
    }
  }

  /**
   * Process image with OCR
   */
  private async processImage(
    filePath: string,
    result: ProcessingResult,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      // Get image metadata
      const imageMetadata = await sharp(filePath).metadata();
      result.metadata.width = imageMetadata.width;
      result.metadata.height = imageMetadata.height;
      result.metadata.format = imageMetadata.format;
      result.metadata.density = imageMetadata.density;

      // Perform OCR if enabled
      if (config.processing.enableOCR && this.tesseractWorker) {
        const ocrResult = await this.tesseractWorker.recognize(filePath);
        result.extractedText = ocrResult.data.text;
        result.ocrConfidence = ocrResult.data.confidence;

        logger.debug('Image OCR completed', {
          confidence: ocrResult.data.confidence,
          textLength: ocrResult.data.text.length,
        });
      }
    } catch (error) {
      logger.error('Failed to process image', error);
      throw error;
    }
  }

  /**
   * Process text file
   */
  private async processText(
    filePath: string,
    result: ProcessingResult,
    options: ProcessingOptions
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      result.extractedText = content;

      logger.debug('Text file processed', {
        textLength: content.length,
      });
    } catch (error) {
      logger.error('Failed to process text file', error);
      throw error;
    }
  }

  /**
   * Generate thumbnails for document
   */
  private async generateThumbnails(
    filePath: string,
    result: ProcessingResult
  ): Promise<void> {
    try {
      if (result.metadata.fileType !== DocumentType.IMAGE) {
        // For non-image files, we would need to convert first page to image
        // This is a simplified implementation
        return;
      }

      for (const size of config.processing.thumbnailSizes) {
        const thumbnailPath = this.getThumbnailPath(filePath, size.suffix);

        await sharp(filePath)
          .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        result.thumbnails.push({
          size: `${size.width}x${size.height}`,
          path: thumbnailPath,
          suffix: size.suffix,
        });
      }

      logger.debug('Thumbnails generated', {
        count: result.thumbnails.length,
      });
    } catch (error) {
      logger.error('Failed to generate thumbnails', error);
      // Don't throw error for thumbnail generation failure
    }
  }

  /**
   * Classify document based on content
   */
  private async classifyDocument(result: ProcessingResult): Promise<void> {
    try {
      const text = result.extractedText.toLowerCase();
      const classifications = [];

      for (const rule of config.classification.rules) {
        if (rule.pattern.test(text)) {
          classifications.push({
            category: rule.category,
            confidence: rule.weight,
            rule: rule.pattern.source,
          });
        }
      }

      // Sort by confidence and take top classifications
      result.classifications = classifications
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      logger.debug('Document classified', {
        classifications: result.classifications.length,
      });
    } catch (error) {
      logger.error('Failed to classify document', error);
      // Don't throw error for classification failure
    }
  }

  /**
   * Initialize OCR worker
   */
  private async initializeOCR(): Promise<void> {
    try {
      this.tesseractWorker = await createWorker(config.ocr.languages);
      logger.info('OCR worker initialized');
    } catch (error) {
      logger.error('Failed to initialize OCR worker', error);
      throw error;
    }
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      config.storage.local.uploadPath,
      config.storage.local.tempPath,
      path.join(config.storage.local.uploadPath, 'thumbnails'),
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  /**
   * Get document type from file extension
   */
  private getDocumentType(extension: string): DocumentType {
    const ext = extension.toLowerCase();

    if (['.pdf'].includes(ext)) return DocumentType.PDF;
    if (['.doc', '.docx'].includes(ext)) return DocumentType.WORD;
    if (['.xls', '.xlsx'].includes(ext)) return DocumentType.EXCEL;
    if (['.ppt', '.pptx'].includes(ext)) return DocumentType.POWERPOINT;
    if (['.txt', '.csv'].includes(ext)) return DocumentType.TEXT;
    if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(ext)) return DocumentType.IMAGE;

    return DocumentType.OTHER;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.tiff': 'image/tiff',
      '.bmp': 'image/bmp',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get thumbnail path
   */
  private getThumbnailPath(originalPath: string, suffix: string): string {
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const thumbnailDir = path.join(config.storage.local.uploadPath, 'thumbnails');
    return path.join(thumbnailDir, `${baseName}_${suffix}.jpg`);
  }

  /**
   * Generate processing ID
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get processing result
   */
  public getProcessingResult(processingId: string): ProcessingResult | undefined {
    return this.processingQueue.get(processingId);
  }

  /**
   * Get all processing results
   */
  public getAllProcessingResults(): ProcessingResult[] {
    return Array.from(this.processingQueue.values());
  }

  /**
   * Shutdown the document processor
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Document Processor...');

    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
    }

    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Document Processor shutdown completed');
  }
}

export default DocumentProcessor;
