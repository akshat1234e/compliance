/**
 * Google Cloud Storage Provider
 * Implementation for Google Cloud Platform storage
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { StorageProvider } from '../StorageManager';

export class GCPStorageProvider implements StorageProvider {
  public readonly name = 'gcp-storage';
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;
  private isInitialized = false;

  constructor() {
    this.bucketName = config.storage.gcp.bucketName;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Google Cloud Storage
      this.storage = new Storage({
        projectId: config.storage.gcp.projectId,
        keyFilename: config.storage.gcp.keyFilename,
      });

      this.bucket = this.storage.bucket(this.bucketName);

      // Check if bucket exists
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`GCP bucket '${this.bucketName}' does not exist`);
      }

      this.isInitialized = true;
      logger.info('GCP Storage provider initialized', {
        bucketName: this.bucketName,
        projectId: config.storage.gcp.projectId,
      });

    } catch (error) {
      logger.error('Failed to initialize GCP Storage provider', { error });
      throw error;
    }
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      
      const uploadOptions = {
        metadata: {
          contentType: this.getContentType(filePath),
          metadata: metadata || {},
        },
        resumable: false,
      };

      await file.save(await fs.readFile(filePath), uploadOptions);
      
      const url = `gs://${this.bucketName}/${key}`;
      
      logger.info('File uploaded to GCP Storage', {
        key,
        bucketName: this.bucketName,
        url,
      });

      return url;

    } catch (error) {
      logger.error('Failed to upload file to GCP Storage', { key, error });
      throw error;
    }
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      
      await file.download({ destination: destinationPath });
      
      logger.info('File downloaded from GCP Storage', {
        key,
        destinationPath,
      });

    } catch (error) {
      logger.error('Failed to download file from GCP Storage', { key, error });
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      
      await file.delete();
      
      logger.info('File deleted from GCP Storage', { key });

    } catch (error) {
      logger.error('Failed to delete file from GCP Storage', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      const [exists] = await file.exists();
      return exists;

    } catch (error) {
      logger.error('Failed to check file existence in GCP Storage', { key, error });
      throw error;
    }
  }

  public async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

      return url;

    } catch (error) {
      logger.error('Failed to generate signed URL for GCP Storage file', { key, error });
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('GCP Storage provider not initialized');
    }

    try {
      const file: File = this.bucket.file(key);
      const [metadata] = await file.getMetadata();
      
      return {
        contentType: metadata.contentType,
        size: parseInt(metadata.size || '0'),
        created: new Date(metadata.timeCreated),
        updated: new Date(metadata.updated),
        etag: metadata.etag,
        generation: metadata.generation,
        storageClass: metadata.storageClass,
        metadata: metadata.metadata || {},
      };

    } catch (error) {
      logger.error('Failed to get metadata from GCP Storage', { key, error });
      throw error;
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.tiff': 'image/tiff',
      '.bmp': 'image/bmp',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}

export default GCPStorageProvider;
