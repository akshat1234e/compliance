/**
 * AWS S3 Storage Provider
 * Implementation for Amazon S3 storage
 */

import AWS from 'aws-sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { StorageProvider } from '../StorageManager';

export class AWSStorageProvider implements StorageProvider {
  public readonly name = 'aws-s3';
  private s3: AWS.S3;
  private bucket: string;
  private region: string;
  private isInitialized = false;

  constructor() {
    this.bucket = config.storage.aws.bucket;
    this.region = config.storage.aws.region;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure AWS SDK
      AWS.config.update({
        accessKeyId: config.storage.aws.accessKeyId,
        secretAccessKey: config.storage.aws.secretAccessKey,
        region: this.region,
      });

      this.s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
        s3ForcePathStyle: false,
        accelerateEndpoint: config.storage.aws.accelerateEndpoint,
      });

      // Test connection by checking if bucket exists
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      
      this.isInitialized = true;
      logger.info('AWS S3 storage provider initialized', {
        bucket: this.bucket,
        region: this.region,
      });

    } catch (error) {
      logger.error('Failed to initialize AWS S3 storage provider', { error });
      throw error;
    }
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const fileContent = await fs.readFile(filePath);
      const contentType = this.getContentType(filePath);

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        Metadata: metadata || {},
        ServerSideEncryption: 'AES256',
        StorageClass: config.storage.aws.storageClass || 'STANDARD',
      };

      // Add lifecycle tags if configured
      if (config.storage.aws.lifecycleTags) {
        uploadParams.Tagging = Object.entries(config.storage.aws.lifecycleTags)
          .map(([k, v]) => `${k}=${v}`)
          .join('&');
      }

      const result = await this.s3.upload(uploadParams).promise();
      
      logger.info('File uploaded to S3', {
        key,
        bucket: this.bucket,
        location: result.Location,
        etag: result.ETag,
      });

      return result.Location;

    } catch (error) {
      logger.error('Failed to upload file to S3', { key, error });
      throw error;
    }
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();
      
      if (result.Body) {
        await fs.writeFile(destinationPath, result.Body as Buffer);
        
        logger.info('File downloaded from S3', {
          key,
          destinationPath,
          size: result.ContentLength,
        });
      } else {
        throw new Error('No content received from S3');
      }

    } catch (error) {
      logger.error('Failed to download file from S3', { key, error });
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      
      logger.info('File deleted from S3', { key });

    } catch (error) {
      logger.error('Failed to delete file from S3', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.headObject(params).promise();
      return true;

    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      logger.error('Failed to check file existence in S3', { key, error });
      throw error;
    }
  }

  public async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const url = this.s3.getSignedUrl('getObject', {
        ...params,
        Expires: expiresIn,
      });

      return url;

    } catch (error) {
      logger.error('Failed to generate signed URL for S3 object', { key, error });
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.headObject(params).promise();
      
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata || {},
        storageClass: result.StorageClass,
        serverSideEncryption: result.ServerSideEncryption,
      };

    } catch (error) {
      logger.error('Failed to get metadata from S3', { key, error });
      throw error;
    }
  }

  public async listObjects(prefix?: string, maxKeys: number = 1000): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>> {
    if (!this.isInitialized) {
      throw new Error('AWS S3 provider not initialized');
    }

    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      return (result.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        etag: obj.ETag!,
      }));

    } catch (error) {
      logger.error('Failed to list objects from S3', { prefix, error });
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

export default AWSStorageProvider;
