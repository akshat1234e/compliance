/**
 * Thumbnail Generation Service
 * Generates thumbnails for various document types (PDF, images, Office docs)
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { logger } from '@utils/logger';
import { config } from '@config/index';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  background?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ThumbnailResult {
  id: string;
  originalFile: string;
  thumbnailPath: string;
  width: number;
  height: number;
  format: string;
  size: number;
  createdAt: Date;
}

export interface ThumbnailSize {
  width: number;
  height: number;
  suffix: string;
}

export class ThumbnailService extends EventEmitter {
  private isInitialized = false;
  private thumbnailSizes: ThumbnailSize[];
  private outputDirectory: string;
  private supportedFormats: Set<string>;

  constructor() {
    super();
    this.thumbnailSizes = config.processing.thumbnailSizes || [
      { width: 150, height: 150, suffix: 'thumb' },
      { width: 300, height: 300, suffix: 'medium' },
      { width: 800, height: 600, suffix: 'large' },
    ];
    this.outputDirectory = config.storage.local.basePath + '/thumbnails';
    this.supportedFormats = new Set([
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    ]);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Thumbnail service already initialized');
      return;
    }

    try {
      logger.info('Initializing Thumbnail Generation Service...');

      // Ensure output directory exists
      await fs.mkdir(this.outputDirectory, { recursive: true });

      // Create subdirectories for different sizes
      for (const size of this.thumbnailSizes) {
        await fs.mkdir(path.join(this.outputDirectory, size.suffix), { recursive: true });
      }

      this.isInitialized = true;
      logger.info('Thumbnail Generation Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Thumbnail Generation Service', error);
      throw error;
    }
  }

  public async generateThumbnails(
    filePath: string,
    documentId: string,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult[]> {
    if (!this.isInitialized) {
      throw new Error('Thumbnail service not initialized');
    }

    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (!this.supportedFormats.has(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      logger.info('Starting thumbnail generation', {
        filePath,
        documentId,
        fileExtension,
        options,
      });

      let thumbnails: ThumbnailResult[] = [];

      switch (fileExtension) {
        case '.pdf':
          thumbnails = await this.generatePDFThumbnails(filePath, documentId, options);
          break;
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
        case '.tiff':
        case '.webp':
          thumbnails = await this.generateImageThumbnails(filePath, documentId, options);
          break;
        case '.doc':
        case '.docx':
        case '.xls':
        case '.xlsx':
        case '.ppt':
        case '.pptx':
          thumbnails = await this.generateOfficeThumbnails(filePath, documentId, options);
          break;
        default:
          thumbnails = await this.generateDefaultThumbnail(filePath, documentId, options);
      }

      logger.info('Thumbnail generation completed', {
        documentId,
        thumbnailCount: thumbnails.length,
        sizes: thumbnails.map(t => `${t.width}x${t.height}`),
      });

      this.emit('thumbnailsGenerated', { documentId, thumbnails });
      return thumbnails;

    } catch (error) {
      logger.error('Thumbnail generation failed', { filePath, documentId, error });
      throw error;
    }
  }

  private async generateImageThumbnails(
    filePath: string,
    documentId: string,
    options: ThumbnailOptions
  ): Promise<ThumbnailResult[]> {
    const thumbnails: ThumbnailResult[] = [];

    for (const size of this.thumbnailSizes) {
      try {
        const outputPath = path.join(
          this.outputDirectory,
          size.suffix,
          `${documentId}_${size.suffix}.${options.format || 'jpeg'}`
        );

        const sharpInstance = sharp(filePath)
          .resize(size.width, size.height, {
            fit: options.fit || 'cover',
            background: options.background || '#ffffff',
          });

        // Apply format-specific options
        switch (options.format || 'jpeg') {
          case 'jpeg':
            sharpInstance.jpeg({ quality: options.quality || 85 });
            break;
          case 'png':
            sharpInstance.png({ quality: options.quality || 85 });
            break;
          case 'webp':
            sharpInstance.webp({ quality: options.quality || 85 });
            break;
        }

        await sharpInstance.toFile(outputPath);

        const stats = await fs.stat(outputPath);
        const metadata = await sharp(outputPath).metadata();

        thumbnails.push({
          id: `${documentId}_${size.suffix}`,
          originalFile: filePath,
          thumbnailPath: outputPath,
          width: metadata.width || size.width,
          height: metadata.height || size.height,
          format: metadata.format || options.format || 'jpeg',
          size: stats.size,
          createdAt: new Date(),
        });

      } catch (error) {
        logger.error('Failed to generate image thumbnail', {
          filePath,
          documentId,
          size,
          error,
        });
      }
    }

    return thumbnails;
  }

  private async generatePDFThumbnails(
    filePath: string,
    documentId: string,
    options: ThumbnailOptions
  ): Promise<ThumbnailResult[]> {
    try {
      // Convert first page of PDF to image using pdf2pic
      const pdf2pic = require('pdf2pic');
      const convert = pdf2pic.fromPath(filePath, {
        density: 300,
        saveFilename: `${documentId}_page`,
        savePath: path.join(this.outputDirectory, 'temp'),
        format: 'png',
        width: 2000,
        height: 2000,
      });

      // Convert first page
      const page = await convert(1, { responseType: 'image' });
      
      if (!page) {
        throw new Error('Failed to convert PDF page to image');
      }

      // Generate thumbnails from the converted image
      const thumbnails = await this.generateImageThumbnails(page.path, documentId, options);

      // Clean up temporary image
      try {
        await fs.unlink(page.path);
      } catch (error) {
        logger.warn('Failed to clean up temporary PDF image', { path: page.path, error });
      }

      return thumbnails;

    } catch (error) {
      logger.error('Failed to generate PDF thumbnails', { filePath, documentId, error });
      // Fallback to default thumbnail
      return await this.generateDefaultThumbnail(filePath, documentId, options);
    }
  }

  private async generateOfficeThumbnails(
    filePath: string,
    documentId: string,
    options: ThumbnailOptions
  ): Promise<ThumbnailResult[]> {
    try {
      // For Office documents, we'll create a placeholder thumbnail
      // In a production environment, you might use LibreOffice or similar for conversion
      const fileExtension = path.extname(filePath).toLowerCase();
      const iconPath = await this.createOfficeIcon(fileExtension, documentId);
      
      return await this.generateImageThumbnails(iconPath, documentId, options);

    } catch (error) {
      logger.error('Failed to generate Office thumbnails', { filePath, documentId, error });
      return await this.generateDefaultThumbnail(filePath, documentId, options);
    }
  }

  private async createOfficeIcon(
    fileExtension: string,
    documentId: string
  ): Promise<string> {
    const iconColors: Record<string, string> = {
      '.doc': '#2B579A',
      '.docx': '#2B579A',
      '.xls': '#217346',
      '.xlsx': '#217346',
      '.ppt': '#D24726',
      '.pptx': '#D24726',
    };

    const color = iconColors[fileExtension] || '#666666';
    const iconText = fileExtension.substring(1).toUpperCase();

    // Create a simple colored rectangle with text as icon
    const iconPath = path.join(this.outputDirectory, 'temp', `${documentId}_icon.png`);
    
    await fs.mkdir(path.dirname(iconPath), { recursive: true });

    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="${color}" rx="10"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="24" 
              font-weight="bold" text-anchor="middle" fill="white">${iconText}</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(iconPath);

    return iconPath;
  }

  private async generateDefaultThumbnail(
    filePath: string,
    documentId: string,
    options: ThumbnailOptions
  ): Promise<ThumbnailResult[]> {
    try {
      // Create a generic file icon
      const fileExtension = path.extname(filePath).toLowerCase();
      const iconPath = await this.createGenericIcon(fileExtension, documentId);
      
      return await this.generateImageThumbnails(iconPath, documentId, options);

    } catch (error) {
      logger.error('Failed to generate default thumbnail', { filePath, documentId, error });
      return [];
    }
  }

  private async createGenericIcon(
    fileExtension: string,
    documentId: string
  ): Promise<string> {
    const iconPath = path.join(this.outputDirectory, 'temp', `${documentId}_generic.png`);
    
    await fs.mkdir(path.dirname(iconPath), { recursive: true });

    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0" stroke="#cccccc" stroke-width="2" rx="10"/>
        <rect x="20" y="20" width="160" height="120" fill="#ffffff" stroke="#cccccc" stroke-width="1" rx="5"/>
        <text x="100" y="170" font-family="Arial, sans-serif" font-size="16" 
              text-anchor="middle" fill="#666666">${fileExtension || 'FILE'}</text>
        <path d="M60 60 L140 60 M60 80 L140 80 M60 100 L120 100" 
              stroke="#cccccc" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(iconPath);

    return iconPath;
  }

  public async getThumbnail(
    documentId: string,
    size: string = 'medium'
  ): Promise<ThumbnailResult | null> {
    if (!this.isInitialized) {
      throw new Error('Thumbnail service not initialized');
    }

    try {
      const sizeConfig = this.thumbnailSizes.find(s => s.suffix === size);
      if (!sizeConfig) {
        throw new Error(`Invalid thumbnail size: ${size}`);
      }

      const thumbnailDir = path.join(this.outputDirectory, size);
      const files = await fs.readdir(thumbnailDir);
      
      const thumbnailFile = files.find(file => file.startsWith(documentId));
      if (!thumbnailFile) {
        return null;
      }

      const thumbnailPath = path.join(thumbnailDir, thumbnailFile);
      const stats = await fs.stat(thumbnailPath);
      const metadata = await sharp(thumbnailPath).metadata();

      return {
        id: `${documentId}_${size}`,
        originalFile: '',
        thumbnailPath,
        width: metadata.width || sizeConfig.width,
        height: metadata.height || sizeConfig.height,
        format: metadata.format || 'jpeg',
        size: stats.size,
        createdAt: stats.birthtime,
      };

    } catch (error) {
      logger.error('Failed to get thumbnail', { documentId, size, error });
      return null;
    }
  }

  public async deleteThumbnails(documentId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Thumbnail service not initialized');
    }

    try {
      for (const size of this.thumbnailSizes) {
        const thumbnailDir = path.join(this.outputDirectory, size.suffix);
        
        try {
          const files = await fs.readdir(thumbnailDir);
          const thumbnailFiles = files.filter(file => file.startsWith(documentId));
          
          for (const file of thumbnailFiles) {
            await fs.unlink(path.join(thumbnailDir, file));
          }
        } catch (error) {
          logger.warn('Failed to delete thumbnails from directory', {
            documentId,
            directory: thumbnailDir,
            error,
          });
        }
      }

      // Clean up temporary files
      const tempDir = path.join(this.outputDirectory, 'temp');
      try {
        const files = await fs.readdir(tempDir);
        const tempFiles = files.filter(file => file.startsWith(documentId));
        
        for (const file of tempFiles) {
          await fs.unlink(path.join(tempDir, file));
        }
      } catch (error) {
        logger.warn('Failed to clean up temporary thumbnail files', { documentId, error });
      }

      logger.info('Thumbnails deleted successfully', { documentId });
      this.emit('thumbnailsDeleted', documentId);

    } catch (error) {
      logger.error('Failed to delete thumbnails', { documentId, error });
      throw error;
    }
  }

  public async getThumbnailStats(): Promise<{
    totalThumbnails: number;
    totalSize: number;
    sizeBreakdown: Record<string, { count: number; size: number }>;
  }> {
    if (!this.isInitialized) {
      throw new Error('Thumbnail service not initialized');
    }

    try {
      let totalThumbnails = 0;
      let totalSize = 0;
      const sizeBreakdown: Record<string, { count: number; size: number }> = {};

      for (const size of this.thumbnailSizes) {
        const thumbnailDir = path.join(this.outputDirectory, size.suffix);
        
        try {
          const files = await fs.readdir(thumbnailDir);
          let sizeTotal = 0;
          
          for (const file of files) {
            const stats = await fs.stat(path.join(thumbnailDir, file));
            sizeTotal += stats.size;
          }
          
          sizeBreakdown[size.suffix] = {
            count: files.length,
            size: sizeTotal,
          };
          
          totalThumbnails += files.length;
          totalSize += sizeTotal;
        } catch (error) {
          logger.warn('Failed to get stats for thumbnail directory', {
            directory: thumbnailDir,
            error,
          });
        }
      }

      return {
        totalThumbnails,
        totalSize,
        sizeBreakdown,
      };

    } catch (error) {
      logger.error('Failed to get thumbnail stats', { error });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Thumbnail Generation Service...');
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Thumbnail Generation Service shutdown completed');
  }
}

export default ThumbnailService;
