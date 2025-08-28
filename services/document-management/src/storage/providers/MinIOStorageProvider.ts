/**
 * MinIO Storage Provider
 * Implementation for MinIO object storage (S3-compatible)
 */

import * as Minio from 'minio';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { StorageProvider } from '../StorageManager';

export class MinIOStorageProvider implements StorageProvider {
  public readonly name = 'minio';
  private client: Minio.Client;
  private bucketName: string;
  private isInitialized = false;

  constructor() {
    this.bucketName = config.storage.minio.bucketName;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize MinIO client
      this.client = new Minio.Client({
        endPoint: config.storage.minio.endPoint,
        port: config.storage.minio.port,
        useSSL: config.storage.minio.useSSL,
        accessKey: config.storage.minio.accessKey,
        secretKey: config.storage.minio.secretKey,
      });

      // Check if bucket exists, create if not
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, config.storage.minio.region || 'us-east-1');
        logger.info('Created MinIO bucket', { bucketName: this.bucketName });
      }

      this.isInitialized = true;
      logger.info('MinIO storage provider initialized', {
        bucketName: this.bucketName,
        endPoint: config.storage.minio.endPoint,
      });

    } catch (error) {
      logger.error('Failed to initialize MinIO storage provider', { error });
      throw error;
    }
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      const fileContent = await fs.readFile(filePath);
      const contentType = this.getContentType(filePath);
      
      const uploadOptions: Minio.PutObjectOptions = {
        'Content-Type': contentType,
        ...metadata,
      };

      await this.client.putObject(
        this.bucketName,
        key,
        fileContent,
        fileContent.length,
        uploadOptions
      );

      const url = `${config.storage.minio.useSSL ? 'https' : 'http'}://${config.storage.minio.endPoint}:${config.storage.minio.port}/${this.bucketName}/${key}`;
      
      logger.info('File uploaded to MinIO', {
        key,
        bucketName: this.bucketName,
        url,
      });

      return url;

    } catch (error) {
      logger.error('Failed to upload file to MinIO', { key, error });
      throw error;
    }
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      const stream = await this.client.getObject(this.bucketName, key);
      
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        stream.on('end', async () => {
          try {
            const fileContent = Buffer.concat(chunks);
            await fs.writeFile(destinationPath, fileContent);
            
            logger.info('File downloaded from MinIO', {
              key,
              destinationPath,
              size: fileContent.length,
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        
        stream.on('error', reject);
      });

    } catch (error) {
      logger.error('Failed to download file from MinIO', { key, error });
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      await this.client.removeObject(this.bucketName, key);
      
      logger.info('File deleted from MinIO', { key });

    } catch (error) {
      logger.error('Failed to delete file from MinIO', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      await this.client.statObject(this.bucketName, key);
      return true;

    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      logger.error('Failed to check file existence in MinIO', { key, error });
      throw error;
    }
  }

  public async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      const url = await this.client.presignedGetObject(
        this.bucketName,
        key,
        expiresIn
      );

      return url;

    } catch (error) {
      logger.error('Failed to generate presigned URL for MinIO object', { key, error });
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('MinIO provider not initialized');
    }

    try {
      const stat = await this.client.statObject(this.bucketName, key);
      
      return {
        contentType: stat.metaData['content-type'],
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        metadata: stat.metaData || {},
      };

    } catch (error) {
      logger.error('Failed to get metadata from MinIO', { key, error });
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

export default MinIOStorageProvider;
