/**
 * Storage Manager
 * Unified storage interface supporting multiple cloud providers
 */

import { config } from '@config/index';
import { logger } from '@utils/logger';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import {
    AWSStorageProvider,
    AzureStorageProvider,
    GCPStorageProvider,
    LocalStorageProvider,
    MinIOStorageProvider
} from './providers';

export interface StorageProvider {
  name: string;
  upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string>;
  download(key: string, destinationPath: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string, expiresIn?: number): Promise<string>;
  getMetadata(key: string): Promise<Record<string, any>>;
}

export class StorageManager extends EventEmitter {
  private provider: StorageProvider;
  private isInitialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize storage manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Storage manager already initialized');
      return;
    }

    try {
      logger.info('Initializing Storage Manager...', {
        provider: config.storage.provider,
      });

      // Initialize storage provider
      switch (config.storage.provider) {
        case 'local':
          this.provider = new LocalStorageProvider();
          break;
        case 'aws':
          this.provider = new AWSStorageProvider();
          break;
        case 'azure':
          this.provider = new AzureStorageProvider();
          break;
        case 'gcp':
          this.provider = new GCPStorageProvider();
          break;
        case 'minio':
          this.provider = new MinIOStorageProvider();
          break;
        default:
          throw new Error(`Unsupported storage provider: ${config.storage.provider}`);
      }

      await this.provider.initialize?.();
      this.isInitialized = true;

      logger.info('Storage Manager initialized successfully', {
        provider: this.provider.name,
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Storage Manager', error);
      throw error;
    }
  }

  /**
   * Upload file to storage
   */
  public async uploadFile(
    filePath: string,
    options: {
      key?: string;
      metadata?: Record<string, any>;
      encrypt?: boolean;
    } = {}
  ): Promise<{ key: string; url: string }> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    try {
      const key = options.key || this.generateStorageKey(filePath);

      logger.info('Uploading file to storage', {
        filePath,
        key,
        provider: this.provider.name,
      });

      // Encrypt file if required
      let uploadPath = filePath;
      if (options.encrypt) {
        uploadPath = await this.encryptFile(filePath);
      }

      // Upload to storage provider
      const url = await this.provider.upload(uploadPath, key, options.metadata);

      // Clean up encrypted file if created
      if (uploadPath !== filePath) {
        await fs.unlink(uploadPath);
      }

      logger.info('File uploaded successfully', {
        key,
        url,
        provider: this.provider.name,
      });

      this.emit('fileUploaded', { key, url, filePath });
      return { key, url };
    } catch (error) {
      logger.error('Failed to upload file', {
        filePath,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Download file from storage
   */
  public async downloadFile(
    key: string,
    destinationPath: string,
    options: {
      decrypt?: boolean;
    } = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    try {
      logger.info('Downloading file from storage', {
        key,
        destinationPath,
        provider: this.provider.name,
      });

      // Download from storage provider
      let downloadPath = destinationPath;
      if (options.decrypt) {
        downloadPath = `${destinationPath}.encrypted`;
      }

      await this.provider.download(key, downloadPath);

      // Decrypt file if required
      if (options.decrypt) {
        await this.decryptFile(downloadPath, destinationPath);
        await fs.unlink(downloadPath);
      }

      logger.info('File downloaded successfully', {
        key,
        destinationPath,
      });

      this.emit('fileDownloaded', { key, destinationPath });
    } catch (error) {
      logger.error('Failed to download file', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  public async deleteFile(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    try {
      logger.info('Deleting file from storage', {
        key,
        provider: this.provider.name,
      });

      await this.provider.delete(key);

      logger.info('File deleted successfully', { key });
      this.emit('fileDeleted', { key });
    } catch (error) {
      logger.error('Failed to delete file', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  public async fileExists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    return this.provider.exists(key);
  }

  /**
   * Get file URL
   */
  public async getFileUrl(key: string, expiresIn?: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    return this.provider.getUrl(key, expiresIn);
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('Storage manager not initialized');
    }

    return this.provider.getMetadata(key);
  }

  /**
   * Generate storage key
   */
  private generateStorageKey(filePath: string): string {
    const fileName = path.basename(filePath);
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    return `documents/${timestamp}/${random}/${baseName}${extension}`;
  }

  /**
   * Encrypt file
   */
  private async encryptFile(filePath: string): Promise<string> {
    const algorithm = config.security.encryption.algorithm;
    const key = Buffer.from(config.security.encryption.key, 'utf8');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    const input = await fs.readFile(filePath);

    const encrypted = Buffer.concat([
      iv,
      cipher.update(input),
      cipher.final(),
    ]);

    const encryptedPath = `${filePath}.encrypted`;
    await fs.writeFile(encryptedPath, encrypted);

    return encryptedPath;
  }

  /**
   * Decrypt file
   */
  private async decryptFile(encryptedPath: string, outputPath: string): Promise<void> {
    const algorithm = config.security.encryption.algorithm;
    const key = Buffer.from(config.security.encryption.key, 'utf8');

    const encrypted = await fs.readFile(encryptedPath);
    const iv = encrypted.slice(0, 16);
    const data = encrypted.slice(16);

    const decipher = crypto.createDecipher(algorithm, key);
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    await fs.writeFile(outputPath, decrypted);
  }

  /**
   * Shutdown storage manager
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Storage Manager...');

    this.isInitialized = false;
    this.emit('shutdown');

    logger.info('Storage Manager shutdown completed');
  }
}

/**
 * Local Storage Provider
 */
class LocalStorageProvider implements StorageProvider {
  public name = 'local';

  public async initialize(): Promise<void> {
    // Ensure upload directory exists
    await fs.mkdir(config.storage.local.uploadPath, { recursive: true });
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    const destinationPath = path.join(config.storage.local.uploadPath, key);
    const destinationDir = path.dirname(destinationPath);

    await fs.mkdir(destinationDir, { recursive: true });
    await fs.copyFile(filePath, destinationPath);

    return `file://${destinationPath}`;
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    const sourcePath = path.join(config.storage.local.uploadPath, key);
    await fs.copyFile(sourcePath, destinationPath);
  }

  public async delete(key: string): Promise<void> {
    const filePath = path.join(config.storage.local.uploadPath, key);
    await fs.unlink(filePath);
  }

  public async exists(key: string): Promise<boolean> {
    const filePath = path.join(config.storage.local.uploadPath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    const filePath = path.join(config.storage.local.uploadPath, key);
    return `file://${filePath}`;
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    const filePath = path.join(config.storage.local.uploadPath, key);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      lastModified: stats.mtime,
      created: stats.birthtime,
    };
  }
}

// Placeholder implementations for cloud providers
class AWSStorageProvider implements StorageProvider {
  public name = 'aws';

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    // AWS S3 implementation would go here
    throw new Error('AWS S3 provider not implemented');
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    throw new Error('AWS S3 provider not implemented');
  }

  public async delete(key: string): Promise<void> {
    throw new Error('AWS S3 provider not implemented');
  }

  public async exists(key: string): Promise<boolean> {
    throw new Error('AWS S3 provider not implemented');
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    throw new Error('AWS S3 provider not implemented');
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    throw new Error('AWS S3 provider not implemented');
  }
}

class AzureStorageProvider implements StorageProvider {
  public name = 'azure';

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    throw new Error('Azure Blob Storage provider not implemented');
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    throw new Error('Azure Blob Storage provider not implemented');
  }

  public async delete(key: string): Promise<void> {
    throw new Error('Azure Blob Storage provider not implemented');
  }

  public async exists(key: string): Promise<boolean> {
    throw new Error('Azure Blob Storage provider not implemented');
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    throw new Error('Azure Blob Storage provider not implemented');
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    throw new Error('Azure Blob Storage provider not implemented');
  }
}

class GCPStorageProvider implements StorageProvider {
  public name = 'gcp';

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    throw new Error('Google Cloud Storage provider not implemented');
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    throw new Error('Google Cloud Storage provider not implemented');
  }

  public async delete(key: string): Promise<void> {
    throw new Error('Google Cloud Storage provider not implemented');
  }

  public async exists(key: string): Promise<boolean> {
    throw new Error('Google Cloud Storage provider not implemented');
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    throw new Error('Google Cloud Storage provider not implemented');
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    throw new Error('Google Cloud Storage provider not implemented');
  }
}

class MinIOStorageProvider implements StorageProvider {
  public name = 'minio';

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    throw new Error('MinIO provider not implemented');
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    throw new Error('MinIO provider not implemented');
  }

  public async delete(key: string): Promise<void> {
    throw new Error('MinIO provider not implemented');
  }

  public async exists(key: string): Promise<boolean> {
    throw new Error('MinIO provider not implemented');
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    throw new Error('MinIO provider not implemented');
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    throw new Error('MinIO provider not implemented');
  }
}

export default StorageManager;
