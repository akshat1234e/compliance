/**
 * Azure Blob Storage Provider
 * Implementation for Microsoft Azure Blob Storage
 */

import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { StorageProvider } from '../StorageManager';

export class AzureStorageProvider implements StorageProvider {
  public readonly name = 'azure-blob';
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private isInitialized = false;

  constructor() {
    this.containerName = config.storage.azure.containerName;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Azure Blob Service Client
      if (config.storage.azure.connectionString) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          config.storage.azure.connectionString
        );
      } else if (config.storage.azure.accountName && config.storage.azure.accountKey) {
        const accountUrl = `https://${config.storage.azure.accountName}.blob.core.windows.net`;
        this.blobServiceClient = new BlobServiceClient(
          accountUrl,
          {
            accountName: config.storage.azure.accountName,
            accountKey: config.storage.azure.accountKey,
          }
        );
      } else {
        throw new Error('Azure storage credentials not provided');
      }

      // Get container client
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);

      // Create container if it doesn't exist
      const containerExists = await this.containerClient.exists();
      if (!containerExists) {
        await this.containerClient.create({
          access: 'private',
          metadata: {
            purpose: 'document-management',
            service: 'compliance-platform',
          },
        });
        logger.info('Created Azure blob container', { containerName: this.containerName });
      }

      this.isInitialized = true;
      logger.info('Azure Blob storage provider initialized', {
        containerName: this.containerName,
        accountName: config.storage.azure.accountName,
      });

    } catch (error) {
      logger.error('Failed to initialize Azure Blob storage provider', { error });
      throw error;
    }
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const fileContent = await fs.readFile(filePath);
      const contentType = this.getContentType(filePath);
      
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
        metadata: metadata || {},
        tags: {
          service: 'document-management',
          uploadDate: new Date().toISOString(),
          ...config.storage.azure.defaultTags,
        },
      };

      const uploadResponse = await blockBlobClient.upload(
        fileContent,
        fileContent.length,
        uploadOptions
      );

      const url = blockBlobClient.url;
      
      logger.info('File uploaded to Azure Blob', {
        key,
        containerName: this.containerName,
        url,
        etag: uploadResponse.etag,
        requestId: uploadResponse.requestId,
      });

      return url;

    } catch (error) {
      logger.error('Failed to upload file to Azure Blob', { key, error });
      throw error;
    }
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);
      
      const downloadResponse = await blockBlobClient.download();
      
      if (downloadResponse.readableStreamBody) {
        const chunks: Buffer[] = [];
        
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(chunk);
        }
        
        const fileContent = Buffer.concat(chunks);
        await fs.writeFile(destinationPath, fileContent);
        
        logger.info('File downloaded from Azure Blob', {
          key,
          destinationPath,
          size: downloadResponse.contentLength,
        });
      } else {
        throw new Error('No content received from Azure Blob');
      }

    } catch (error) {
      logger.error('Failed to download file from Azure Blob', { key, error });
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);
      
      await blockBlobClient.delete({
        deleteSnapshots: 'include',
      });
      
      logger.info('File deleted from Azure Blob', { key });

    } catch (error) {
      logger.error('Failed to delete file from Azure Blob', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);
      return await blockBlobClient.exists();

    } catch (error) {
      logger.error('Failed to check file existence in Azure Blob', { key, error });
      throw error;
    }
  }

  public async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);
      
      // Generate SAS URL for temporary access
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r', // Read permission
        expiresOn: new Date(Date.now() + expiresIn * 1000),
      });

      return sasUrl;

    } catch (error) {
      logger.error('Failed to generate SAS URL for Azure Blob', { key, error });
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(key);
      
      const properties = await blockBlobClient.getProperties();
      
      return {
        contentType: properties.contentType,
        contentLength: properties.contentLength,
        lastModified: properties.lastModified,
        etag: properties.etag,
        metadata: properties.metadata || {},
        blobType: properties.blobType,
        accessTier: properties.accessTier,
        serverEncrypted: properties.isServerEncrypted,
      };

    } catch (error) {
      logger.error('Failed to get metadata from Azure Blob', { key, error });
      throw error;
    }
  }

  public async listBlobs(prefix?: string, maxResults: number = 1000): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>> {
    if (!this.isInitialized) {
      throw new Error('Azure Blob provider not initialized');
    }

    try {
      const blobs: Array<{
        key: string;
        size: number;
        lastModified: Date;
        etag: string;
      }> = [];

      const listOptions = {
        prefix,
        includeMetadata: false,
        includeSnapshots: false,
        includeVersions: false,
      };

      let count = 0;
      for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
        if (count >= maxResults) break;
        
        blobs.push({
          key: blob.name,
          size: blob.properties.contentLength || 0,
          lastModified: blob.properties.lastModified || new Date(),
          etag: blob.properties.etag || '',
        });
        
        count++;
      }

      return blobs;

    } catch (error) {
      logger.error('Failed to list blobs from Azure Blob', { prefix, error });
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

export default AzureStorageProvider;
