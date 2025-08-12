/**
 * Local Storage Provider
 * Implementation for local file system storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { StorageProvider } from '../StorageManager';

export class LocalStorageProvider implements StorageProvider {
  public readonly name = 'local-filesystem';
  private basePath: string;
  private isInitialized = false;

  constructor() {
    this.basePath = config.storage.local.basePath || './storage';
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Ensure base directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Create subdirectories for organization
      const subdirs = ['documents', 'thumbnails', 'temp', 'quarantine'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.basePath, subdir), { recursive: true });
      }

      this.isInitialized = true;
      logger.info('Local storage provider initialized', {
        basePath: this.basePath,
      });

    } catch (error) {
      logger.error('Failed to initialize local storage provider', { error });
      throw error;
    }
  }

  public async upload(filePath: string, key: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const destinationPath = path.join(this.basePath, key);
      const destinationDir = path.dirname(destinationPath);
      
      // Ensure destination directory exists
      await fs.mkdir(destinationDir, { recursive: true });
      
      // Copy file to destination
      await fs.copyFile(filePath, destinationPath);
      
      // Store metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        const metadataPath = `${destinationPath}.metadata.json`;
        await fs.writeFile(metadataPath, JSON.stringify({
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalPath: filePath,
        }, null, 2));
      }

      const url = `file://${path.resolve(destinationPath)}`;
      
      logger.info('File uploaded to local storage', {
        key,
        destinationPath,
        url,
      });

      return url;

    } catch (error) {
      logger.error('Failed to upload file to local storage', { key, error });
      throw error;
    }
  }

  public async download(key: string, destinationPath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const sourcePath = path.join(this.basePath, key);
      
      // Check if source file exists
      await fs.access(sourcePath);
      
      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath);
      await fs.mkdir(destinationDir, { recursive: true });
      
      // Copy file to destination
      await fs.copyFile(sourcePath, destinationPath);
      
      logger.info('File downloaded from local storage', {
        key,
        sourcePath,
        destinationPath,
      });

    } catch (error) {
      logger.error('Failed to download file from local storage', { key, error });
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const filePath = path.join(this.basePath, key);
      const metadataPath = `${filePath}.metadata.json`;
      
      // Delete main file
      try {
        await fs.unlink(filePath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      // Delete metadata file if exists
      try {
        await fs.unlink(metadataPath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          logger.warn('Failed to delete metadata file', { metadataPath, error });
        }
      }
      
      logger.info('File deleted from local storage', { key });

    } catch (error) {
      logger.error('Failed to delete file from local storage', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const filePath = path.join(this.basePath, key);
      await fs.access(filePath);
      return true;

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      logger.error('Failed to check file existence in local storage', { key, error });
      throw error;
    }
  }

  public async getUrl(key: string, expiresIn?: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const filePath = path.join(this.basePath, key);
      
      // Check if file exists
      await fs.access(filePath);
      
      // For local storage, return file:// URL
      // Note: expiresIn is ignored for local storage
      const url = `file://${path.resolve(filePath)}`;
      
      return url;

    } catch (error) {
      logger.error('Failed to generate URL for local storage file', { key, error });
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const filePath = path.join(this.basePath, key);
      const metadataPath = `${filePath}.metadata.json`;
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Try to read metadata file
      let storedMetadata = {};
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        storedMetadata = JSON.parse(metadataContent);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          logger.warn('Failed to read metadata file', { metadataPath, error });
        }
      }
      
      return {
        contentLength: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mode: stats.mode,
        ...storedMetadata,
      };

    } catch (error) {
      logger.error('Failed to get metadata from local storage', { key, error });
      throw error;
    }
  }

  public async listFiles(prefix?: string, maxResults: number = 1000): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const files: Array<{
        key: string;
        size: number;
        lastModified: Date;
        etag: string;
      }> = [];

      const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;
      
      const collectFiles = async (dirPath: string, currentPrefix: string = ''): Promise<void> => {
        if (files.length >= maxResults) return;
        
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (files.length >= maxResults) break;
            
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.join(currentPrefix, entry.name);
            
            if (entry.isFile() && !entry.name.endsWith('.metadata.json')) {
              const stats = await fs.stat(fullPath);
              
              files.push({
                key: relativePath,
                size: stats.size,
                lastModified: stats.mtime,
                etag: `"${stats.mtime.getTime()}-${stats.size}"`, // Simple etag
              });
            } else if (entry.isDirectory()) {
              await collectFiles(fullPath, relativePath);
            }
          }
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            logger.warn('Failed to read directory', { dirPath, error });
          }
        }
      };

      await collectFiles(searchPath);
      
      return files;

    } catch (error) {
      logger.error('Failed to list files from local storage', { prefix, error });
      throw error;
    }
  }

  public async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    availableSpace: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('Local storage provider not initialized');
    }

    try {
      const files = await this.listFiles();
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Get available space (simplified - would need platform-specific implementation for accuracy)
      const stats = await fs.stat(this.basePath);
      const availableSpace = 0; // Placeholder - would need statvfs or similar
      
      return {
        totalFiles,
        totalSize,
        availableSpace,
      };

    } catch (error) {
      logger.error('Failed to get storage stats', { error });
      throw error;
    }
  }
}

export default LocalStorageProvider;
