/**
 * Document Versioning Service
 * Handles document version control, audit trails, and rollback capabilities
 */

import { logger } from '@utils/logger';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  storageKey: string;
  fileSize: number;
  checksum: string;
  mimeType: string;

  // Version metadata
  versionType: 'major' | 'minor' | 'patch';
  changeDescription?: string;
  changeReason?: string;
  tags?: string[];

  // User information
  createdBy: string;
  createdAt: Date;

  // Content changes
  contentChanges?: {
    added: number;
    removed: number;
    modified: number;
    similarity: number; // 0-1 similarity score
  };

  // Approval workflow
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  approvalComments?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface VersionComparison {
  fromVersion: DocumentVersion;
  toVersion: DocumentVersion;
  changes: {
    type: 'content' | 'metadata' | 'structure';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  similarity: number;
  recommendation: 'approve' | 'review' | 'reject';
}

export interface VersioningOptions {
  enableAutoVersioning?: boolean;
  maxVersions?: number;
  retentionPeriod?: number; // days
  requireApproval?: boolean;
  enableContentComparison?: boolean;
  compressionEnabled?: boolean;
}

export class VersioningService extends EventEmitter {
  private isInitialized = false;
  private versions: Map<string, DocumentVersion[]> = new Map();
  private options: VersioningOptions;

  constructor(options: VersioningOptions = {}) {
    super();
    this.options = {
      enableAutoVersioning: true,
      maxVersions: 50,
      retentionPeriod: 365,
      requireApproval: false,
      enableContentComparison: true,
      compressionEnabled: true,
      ...options
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Versioning service already initialized');
      return;
    }

    try {
      logger.info('Initializing Document Versioning Service...');

      // Load existing versions from database
      await this.loadVersionsFromDatabase();

      // Setup cleanup scheduler
      this.setupCleanupScheduler();

      this.isInitialized = true;
      logger.info('Document Versioning Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Document Versioning Service', error);
      throw error;
    }
  }

  public async createVersion(
    documentId: string,
    filePath: string,
    storageKey: string,
    metadata: {
      fileSize: number;
      checksum: string;
      mimeType: string;
      createdBy: string;
      versionType?: 'major' | 'minor' | 'patch';
      changeDescription?: string;
      changeReason?: string;
      tags?: string[];
    }
  ): Promise<DocumentVersion> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    try {
      const existingVersions = this.versions.get(documentId) || [];
      const nextVersion = existingVersions.length + 1;

      const version: DocumentVersion = {
        id: uuidv4(),
        documentId,
        version: nextVersion,
        filePath,
        storageKey,
        fileSize: metadata.fileSize,
        checksum: metadata.checksum,
        mimeType: metadata.mimeType,
        versionType: metadata.versionType || 'minor',
        changeDescription: metadata.changeDescription,
        changeReason: metadata.changeReason,
        tags: metadata.tags || [],
        createdBy: metadata.createdBy,
        createdAt: new Date(),
        approvalStatus: this.options.requireApproval ? 'pending' : 'approved',
      };

      // Calculate content changes if previous version exists
      if (existingVersions.length > 0) {
        const previousVersion = existingVersions[existingVersions.length - 1];
        if (this.options.enableContentComparison) {
          version.contentChanges = await this.calculateContentChanges(previousVersion, version);
        }
      }

      // Add version to collection
      existingVersions.push(version);
      this.versions.set(documentId, existingVersions);

      // Save to database
      await this.saveVersionToDatabase(version);

      // Cleanup old versions if needed
      await this.cleanupOldVersions(documentId);

      logger.info('Document version created', {
        documentId,
        versionId: version.id,
        version: version.version,
        versionType: version.versionType,
        createdBy: version.createdBy,
      });

      this.emit('versionCreated', version);
      return version;

    } catch (error) {
      logger.error('Failed to create document version', { documentId, error });
      throw error;
    }
  }

  public async getVersions(documentId: string): Promise<DocumentVersion[]> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    return this.versions.get(documentId) || [];
  }

  public async getVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | null> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    const versions = this.versions.get(documentId) || [];
    return versions.find(v => v.version === versionNumber) || null;
  }

  public async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    const versions = this.versions.get(documentId) || [];
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  public async compareVersions(
    documentId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionComparison | null> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    try {
      const versions = this.versions.get(documentId) || [];
      const fromVer = versions.find(v => v.version === fromVersion);
      const toVer = versions.find(v => v.version === toVersion);

      if (!fromVer || !toVer) {
        return null;
      }

      const changes = await this.analyzeVersionChanges(fromVer, toVer);
      const similarity = this.calculateSimilarity(fromVer, toVer);
      const recommendation = this.getRecommendation(changes, similarity);

      return {
        fromVersion: fromVer,
        toVersion: toVer,
        changes,
        similarity,
        recommendation,
      };

    } catch (error) {
      logger.error('Failed to compare versions', { documentId, fromVersion, toVersion, error });
      throw error;
    }
  }

  public async rollbackToVersion(
    documentId: string,
    targetVersion: number,
    rollbackBy: string,
    reason?: string
  ): Promise<DocumentVersion> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    try {
      const versions = this.versions.get(documentId) || [];
      const targetVer = versions.find(v => v.version === targetVersion);

      if (!targetVer) {
        throw new Error(`Version ${targetVersion} not found for document ${documentId}`);
      }

      // Create a new version based on the target version
      const rollbackVersion: DocumentVersion = {
        ...targetVer,
        id: uuidv4(),
        version: versions.length + 1,
        versionType: 'major',
        changeDescription: `Rollback to version ${targetVersion}`,
        changeReason: reason || 'Document rollback',
        createdBy: rollbackBy,
        createdAt: new Date(),
        approvalStatus: 'approved',
        tags: [...(targetVer.tags || []), 'rollback'],
        metadata: {
          ...targetVer.metadata,
          rollbackFrom: versions[versions.length - 1].version,
          rollbackTo: targetVersion,
          rollbackReason: reason,
        },
      };

      // Add rollback version
      versions.push(rollbackVersion);
      this.versions.set(documentId, versions);

      // Save to database
      await this.saveVersionToDatabase(rollbackVersion);

      logger.info('Document rolled back', {
        documentId,
        targetVersion,
        newVersion: rollbackVersion.version,
        rollbackBy,
        reason,
      });

      this.emit('versionRolledBack', {
        documentId,
        targetVersion,
        newVersion: rollbackVersion,
        rollbackBy,
      });

      return rollbackVersion;

    } catch (error) {
      logger.error('Failed to rollback document version', { documentId, targetVersion, error });
      throw error;
    }
  }

  public async approveVersion(
    documentId: string,
    versionNumber: number,
    approvedBy: string,
    comments?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    try {
      const versions = this.versions.get(documentId) || [];
      const version = versions.find(v => v.version === versionNumber);

      if (!version) {
        throw new Error(`Version ${versionNumber} not found for document ${documentId}`);
      }

      version.approvalStatus = 'approved';
      version.approvedBy = approvedBy;
      version.approvedAt = new Date();
      version.approvalComments = comments;

      // Update in database
      await this.updateVersionInDatabase(version);

      logger.info('Document version approved', {
        documentId,
        versionNumber,
        approvedBy,
      });

      this.emit('versionApproved', version);

    } catch (error) {
      logger.error('Failed to approve document version', { documentId, versionNumber, error });
      throw error;
    }
  }

  public async rejectVersion(
    documentId: string,
    versionNumber: number,
    rejectedBy: string,
    comments?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Versioning service not initialized');
    }

    try {
      const versions = this.versions.get(documentId) || [];
      const version = versions.find(v => v.version === versionNumber);

      if (!version) {
        throw new Error(`Version ${versionNumber} not found for document ${documentId}`);
      }

      version.approvalStatus = 'rejected';
      version.approvedBy = rejectedBy;
      version.approvedAt = new Date();
      version.approvalComments = comments;

      // Update in database
      await this.updateVersionInDatabase(version);

      logger.info('Document version rejected', {
        documentId,
        versionNumber,
        rejectedBy,
      });

      this.emit('versionRejected', version);

    } catch (error) {
      logger.error('Failed to reject document version', { documentId, versionNumber, error });
      throw error;
    }
  }

  private async calculateContentChanges(
    previousVersion: DocumentVersion,
    currentVersion: DocumentVersion
  ): Promise<{
    added: number;
    removed: number;
    modified: number;
    similarity: number;
  }> {
    // Simplified content change calculation
    // In a real implementation, this would use diff algorithms
    const sizeDiff = Math.abs(currentVersion.fileSize - previousVersion.fileSize);
    const sizeRatio = Math.min(currentVersion.fileSize, previousVersion.fileSize) /
                     Math.max(currentVersion.fileSize, previousVersion.fileSize);

    const similarity = currentVersion.checksum === previousVersion.checksum ? 1.0 : sizeRatio;

    return {
      added: currentVersion.fileSize > previousVersion.fileSize ? sizeDiff : 0,
      removed: currentVersion.fileSize < previousVersion.fileSize ? sizeDiff : 0,
      modified: sizeDiff,
      similarity,
    };
  }

  private async analyzeVersionChanges(
    fromVersion: DocumentVersion,
    toVersion: DocumentVersion
  ): Promise<Array<{
    type: 'content' | 'metadata' | 'structure';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>> {
    const changes: Array<{
      type: 'content' | 'metadata' | 'structure';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    // Content changes
    if (fromVersion.checksum !== toVersion.checksum) {
      const sizeDiff = Math.abs(toVersion.fileSize - fromVersion.fileSize);
      const impact = sizeDiff > fromVersion.fileSize * 0.5 ? 'high' :
                    sizeDiff > fromVersion.fileSize * 0.1 ? 'medium' : 'low';

      changes.push({
        type: 'content',
        description: `File content changed (${sizeDiff} bytes difference)`,
        impact,
      });
    }

    // MIME type changes
    if (fromVersion.mimeType !== toVersion.mimeType) {
      changes.push({
        type: 'structure',
        description: `File type changed from ${fromVersion.mimeType} to ${toVersion.mimeType}`,
        impact: 'high',
      });
    }

    // Version type changes
    if (fromVersion.versionType !== toVersion.versionType) {
      changes.push({
        type: 'metadata',
        description: `Version type changed from ${fromVersion.versionType} to ${toVersion.versionType}`,
        impact: 'low',
      });
    }

    return changes;
  }

  private calculateSimilarity(fromVersion: DocumentVersion, toVersion: DocumentVersion): number {
    if (fromVersion.checksum === toVersion.checksum) {
      return 1.0;
    }

    const sizeRatio = Math.min(fromVersion.fileSize, toVersion.fileSize) /
                     Math.max(fromVersion.fileSize, toVersion.fileSize);

    const mimeTypeMatch = fromVersion.mimeType === toVersion.mimeType ? 1.0 : 0.5;

    return (sizeRatio + mimeTypeMatch) / 2;
  }

  private getRecommendation(
    changes: Array<{ impact: 'low' | 'medium' | 'high' }>,
    similarity: number
  ): 'approve' | 'review' | 'reject' {
    const highImpactChanges = changes.filter(c => c.impact === 'high').length;
    const mediumImpactChanges = changes.filter(c => c.impact === 'medium').length;

    if (highImpactChanges > 2 || similarity < 0.3) {
      return 'reject';
    } else if (highImpactChanges > 0 || mediumImpactChanges > 3 || similarity < 0.7) {
      return 'review';
    } else {
      return 'approve';
    }
  }

  private async cleanupOldVersions(documentId: string): Promise<void> {
    if (!this.options.maxVersions) {
      return;
    }

    const versions = this.versions.get(documentId) || [];

    if (versions.length > this.options.maxVersions) {
      const versionsToRemove = versions.slice(0, versions.length - this.options.maxVersions);
      const remainingVersions = versions.slice(versions.length - this.options.maxVersions);

      // Remove old versions from storage and database
      for (const version of versionsToRemove) {
        try {
          await this.deleteVersionFromDatabase(version.id);
          // Note: Storage cleanup would be handled by StorageManager
        } catch (error) {
          logger.warn('Failed to cleanup old version', { versionId: version.id, error });
        }
      }

      this.versions.set(documentId, remainingVersions);

      logger.info('Cleaned up old versions', {
        documentId,
        removedCount: versionsToRemove.length,
        remainingCount: remainingVersions.length,
      });
    }
  }

  private setupCleanupScheduler(): void {
    // Setup periodic cleanup based on retention period
    if (this.options.retentionPeriod) {
      setInterval(async () => {
        await this.performRetentionCleanup();
      }, 24 * 60 * 60 * 1000); // Daily cleanup
    }
  }

  private async performRetentionCleanup(): Promise<void> {
    if (!this.options.retentionPeriod) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionPeriod);

    let totalCleaned = 0;

    for (const [documentId, versions] of this.versions.entries()) {
      const versionsToKeep = versions.filter(v => v.createdAt > cutoffDate);
      const versionsToRemove = versions.filter(v => v.createdAt <= cutoffDate);

      if (versionsToRemove.length > 0) {
        // Always keep at least one version
        if (versionsToKeep.length === 0 && versionsToRemove.length > 0) {
          versionsToKeep.push(versionsToRemove.pop()!);
        }

        // Remove old versions
        for (const version of versionsToRemove) {
          try {
            await this.deleteVersionFromDatabase(version.id);
          } catch (error) {
            logger.warn('Failed to cleanup expired version', { versionId: version.id, error });
          }
        }

        this.versions.set(documentId, versionsToKeep);
        totalCleaned += versionsToRemove.length;
      }
    }

    if (totalCleaned > 0) {
      logger.info('Retention cleanup completed', {
        versionsRemoved: totalCleaned,
        retentionPeriod: this.options.retentionPeriod,
      });
    }
  }

  // Database operations (placeholder implementations)
  private async loadVersionsFromDatabase(): Promise<void> {
    // TODO: Implement database loading
    logger.debug('Loading versions from database...');
  }

  private async saveVersionToDatabase(version: DocumentVersion): Promise<void> {
    // TODO: Implement database saving
    logger.debug('Saving version to database', { versionId: version.id });
  }

  private async updateVersionInDatabase(version: DocumentVersion): Promise<void> {
    // TODO: Implement database updating
    logger.debug('Updating version in database', { versionId: version.id });
  }

  private async deleteVersionFromDatabase(versionId: string): Promise<void> {
    // TODO: Implement database deletion
    logger.debug('Deleting version from database', { versionId });
  }

  public async getVersioningStats(documentId?: string): Promise<{
    totalVersions: number;
    totalDocuments: number;
    averageVersionsPerDocument: number;
    storageUsed: number;
    oldestVersion: Date | null;
    newestVersion: Date | null;
  }> {
    let totalVersions = 0;
    let totalDocuments = 0;
    let storageUsed = 0;
    let oldestVersion: Date | null = null;
    let newestVersion: Date | null = null;

    const documentsToCheck = documentId ? [documentId] : Array.from(this.versions.keys());

    for (const docId of documentsToCheck) {
      const versions = this.versions.get(docId) || [];
      if (versions.length > 0) {
        totalDocuments++;
        totalVersions += versions.length;

        for (const version of versions) {
          storageUsed += version.fileSize;

          if (!oldestVersion || version.createdAt < oldestVersion) {
            oldestVersion = version.createdAt;
          }

          if (!newestVersion || version.createdAt > newestVersion) {
            newestVersion = version.createdAt;
          }
        }
      }
    }

    return {
      totalVersions,
      totalDocuments,
      averageVersionsPerDocument: totalDocuments > 0 ? totalVersions / totalDocuments : 0,
      storageUsed,
      oldestVersion,
      newestVersion,
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Document Versioning Service...');
    this.versions.clear();
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Document Versioning Service shutdown completed');
  }
}

export default VersioningService;
