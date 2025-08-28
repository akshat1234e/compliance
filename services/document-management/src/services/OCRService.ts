/**
 * OCR Service
 * Optical Character Recognition service for document text extraction
 */

import { logger } from '@utils/logger';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  blocks?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface OCROptions {
  language?: string;
  psm?: number; // Page segmentation mode
  oem?: number; // OCR Engine mode
  whitelist?: string;
  blacklist?: string;
  preprocessImage?: boolean;
  enhanceContrast?: boolean;
  removeNoise?: boolean;
}

export class OCRService extends EventEmitter {
  private isInitialized = false;
  private workers: Map<string, Worker> = new Map();
  private maxWorkers = 3;
  private workerQueue: string[] = [];

  constructor() {
    super();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('OCR service already initialized');
      return;
    }

    try {
      logger.info('Initializing OCR Service...');

      // Initialize Tesseract workers
      await this.initializeWorkers();

      this.isInitialized = true;
      logger.info('OCR Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize OCR Service', error);
      throw error;
    }
  }

  private async initializeWorkers(): Promise<void> {
    const languages = ['eng', 'hin']; // English and Hindi for Indian regulatory documents

    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = `worker_${i}`;
      const worker = await createWorker();

      await worker.loadLanguage(languages.join('+'));
      await worker.initialize(languages.join('+'));

      // Configure worker for better accuracy
      await worker.setParameters({
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?@#$%^&*()_+-=[]{}|;:\'"<>/\\ ₹',
      });

      this.workers.set(workerId, worker);
      this.workerQueue.push(workerId);

      logger.info(`OCR Worker ${workerId} initialized`);
    }
  }

  private async getAvailableWorker(): Promise<{ id: string; worker: Worker }> {
    return new Promise((resolve) => {
      const checkWorker = () => {
        if (this.workerQueue.length > 0) {
          const workerId = this.workerQueue.shift()!;
          const worker = this.workers.get(workerId)!;
          resolve({ id: workerId, worker });
        } else {
          // Wait and check again
          setTimeout(checkWorker, 100);
        }
      };
      checkWorker();
    });
  }

  private releaseWorker(workerId: string): void {
    this.workerQueue.push(workerId);
  }

  public async extractText(filePath: string, options: OCROptions = {}): Promise<OCRResult> {
    if (!this.isInitialized) {
      throw new Error('OCR Service not initialized');
    }

    try {
      logger.info('Starting OCR text extraction', { filePath, options });

      // Preprocess image if needed
      let processedImagePath = filePath;
      if (options.preprocessImage !== false) {
        processedImagePath = await this.preprocessImage(filePath, options);
      }

      // Get available worker
      const { id: workerId, worker } = await this.getAvailableWorker();

      try {
        // Configure worker for this specific task
        if (options.psm !== undefined) {
          await worker.setParameters({ tessedit_pageseg_mode: options.psm.toString() });
        }
        if (options.oem !== undefined) {
          await worker.setParameters({ tessedit_ocr_engine_mode: options.oem.toString() });
        }
        if (options.whitelist) {
          await worker.setParameters({ tessedit_char_whitelist: options.whitelist });
        }
        if (options.blacklist) {
          await worker.setParameters({ tessedit_char_blacklist: options.blacklist });
        }

        // Perform OCR
        const { data } = await worker.recognize(processedImagePath);

        // Extract detailed information
        const result: OCRResult = {
          text: data.text.trim(),
          confidence: data.confidence / 100,
          words: data.words?.map(word => ({
            text: word.text,
            confidence: word.confidence / 100,
            bbox: word.bbox
          })),
          blocks: data.blocks?.map(block => ({
            text: block.text,
            confidence: block.confidence / 100,
            bbox: block.bbox
          }))
        };

        logger.info('OCR extraction completed', {
          filePath,
          textLength: result.text.length,
          confidence: result.confidence,
          wordsCount: result.words?.length || 0
        });

        return result;

      } finally {
        // Release worker back to queue
        this.releaseWorker(workerId);

        // Clean up preprocessed image if it was created
        if (processedImagePath !== filePath) {
          try {
            await fs.unlink(processedImagePath);
          } catch (error) {
            logger.warn('Failed to clean up preprocessed image', { error });
          }
        }
      }

    } catch (error) {
      logger.error('OCR text extraction failed', { filePath, error });
      throw error;
    }
  }

  private async preprocessImage(filePath: string, options: OCROptions): Promise<string> {
    try {
      const ext = path.extname(filePath);
      const tempPath = path.join(path.dirname(filePath), `temp_${Date.now()}${ext}`);

      let sharpInstance = sharp(filePath);

      // Enhance contrast if requested
      if (options.enhanceContrast !== false) {
        sharpInstance = sharpInstance.normalize();
      }

      // Remove noise if requested
      if (options.removeNoise !== false) {
        sharpInstance = sharpInstance.median(3);
      }

      // Convert to grayscale for better OCR
      sharpInstance = sharpInstance.grayscale();

      // Increase resolution for better text recognition
      sharpInstance = sharpInstance.resize({ width: 2000, withoutEnlargement: false });

      // Sharpen the image
      sharpInstance = sharpInstance.sharpen();

      await sharpInstance.png().toFile(tempPath);

      logger.debug('Image preprocessed for OCR', { original: filePath, processed: tempPath });
      return tempPath;

    } catch (error) {
      logger.error('Image preprocessing failed', { filePath, error });
      throw error;
    }
  }

  public async extractTextFromPDF(pdfPath: string, options: OCROptions = {}): Promise<OCRResult[]> {
    if (!this.isInitialized) {
      throw new Error('OCR Service not initialized');
    }

    try {
      logger.info('Starting PDF OCR extraction', { pdfPath });

      // Convert PDF pages to images using pdf2pic
      const pdf2pic = require('pdf2pic');
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,           // High DPI for better text recognition
        saveFilename: "page",
        savePath: path.dirname(pdfPath),
        format: "png",
        width: 2000,
        height: 2000
      });

      const results: OCRResult[] = [];
      let pageNumber = 1;

      try {
        while (true) {
          const page = await convert(pageNumber, { responseType: "image" });
          if (!page) break;

          const imagePath = page.path;
          const ocrResult = await this.extractText(imagePath, options);
          results.push(ocrResult);

          // Clean up page image
          try {
            await fs.unlink(imagePath);
          } catch (error) {
            logger.warn('Failed to clean up page image', { imagePath, error });
          }

          pageNumber++;
        }
      } catch (error) {
        // End of pages or conversion error
        if (pageNumber === 1) {
          throw error; // If first page failed, it's a real error
        }
      }

      logger.info('PDF OCR extraction completed', {
        pdfPath,
        pagesProcessed: results.length,
        totalTextLength: results.reduce((sum, r) => sum + r.text.length, 0)
      });

      return results;

    } catch (error) {
      logger.error('PDF OCR extraction failed', { pdfPath, error });
      throw error;
    }
  }

  public async extractTextFromMultipleImages(imagePaths: string[], options: OCROptions = {}): Promise<OCRResult[]> {
    if (!this.isInitialized) {
      throw new Error('OCR Service not initialized');
    }

    const results: OCRResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.extractText(imagePath, options);
        results.push(result);
      } catch (error) {
        logger.error('Failed to extract text from image', { imagePath, error });
        // Continue with other images
        results.push({
          text: '',
          confidence: 0,
          words: [],
          blocks: []
        });
      }
    }

    return results;
  }

  public async getLanguages(): Promise<string[]> {
    return ['eng', 'hin']; // Supported languages
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down OCR Service...');

    // Terminate all workers
    for (const [workerId, worker] of this.workers) {
      try {
        await worker.terminate();
        logger.info(`OCR Worker ${workerId} terminated`);
      } catch (error) {
        logger.error(`Failed to terminate worker ${workerId}`, error);
      }
    }

    this.workers.clear();
    this.workerQueue = [];
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('OCR Service shutdown completed');
  }
}

export default OCRService;
