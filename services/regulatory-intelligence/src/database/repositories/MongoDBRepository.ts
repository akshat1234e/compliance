/**
 * MongoDB Repository
 * Data access layer for document-based data operations
 */

import { Db, Collection, ObjectId, Filter, UpdateFilter, FindOptions } from 'mongodb';
import { logger } from '@utils/logger';
import { databaseManager } from '../connection';
import {
  CircularContent,
  TimelineMapping,
  NotificationLog,
  COLLECTION_NAMES,
} from '../models';

export interface MongoFilterOptions {
  [key: string]: any;
}

export interface MongoPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 1 | -1;
}

export class MongoDBRepository {
  private db: Db;

  constructor() {
    this.db = databaseManager.getMongoDB();
  }

  /**
   * Get collection with proper typing
   */
  private getCollection<T>(collectionName: string): Collection<T> {
    return this.db.collection<T>(collectionName);
  }

  /**
   * Generic find operation with pagination
   */
  private async findWithPagination<T>(
    collection: Collection<T>,
    filter: Filter<T> = {},
    pagination: MongoPaginationOptions = { page: 1, limit: 20 },
    options: FindOptions<T> = {}
  ): Promise<{ data: T[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || '_id';
    const sortOrder = pagination.sortOrder || -1;

    const [data, total] = await Promise.all([
      collection
        .find(filter, options)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(pagination.limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return { data, total };
  }

  // Circular Content Operations
  async createCircularContent(content: Omit<CircularContent, '_id' | 'created_at' | 'updated_at'>): Promise<CircularContent> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    const document: Omit<CircularContent, '_id'> = {
      ...content,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const result = await collection.insertOne(document as CircularContent);
      const inserted = await collection.findOne({ _id: result.insertedId });
      
      if (!inserted) {
        throw new Error('Failed to retrieve inserted document');
      }

      logger.info('Circular content created', {
        id: result.insertedId.toString(),
        circular_id: content.circular_id,
      });

      return inserted;
    } catch (error) {
      logger.error('Failed to create circular content', {
        circular_id: content.circular_id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getCircularContentById(id: string): Promise<CircularContent | null> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    try {
      const objectId = new ObjectId(id);
      const result = await collection.findOne({ _id: objectId });
      return result;
    } catch (error) {
      logger.error('Failed to get circular content by ID', {
        id,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async getCircularContentByCircularId(circularId: string): Promise<CircularContent | null> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    try {
      const result = await collection.findOne({ circular_id: circularId });
      return result;
    } catch (error) {
      logger.error('Failed to get circular content by circular ID', {
        circular_id: circularId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async updateCircularContent(id: string, updates: Partial<CircularContent>): Promise<CircularContent | null> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    try {
      const objectId = new ObjectId(id);
      const updateDoc: UpdateFilter<CircularContent> = {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      };

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        updateDoc,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Failed to update circular content', {
        id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getCircularContents(
    filters: MongoFilterOptions = {},
    pagination: MongoPaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: CircularContent[]; total: number }> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    return this.findWithPagination(collection, filters, pagination);
  }

  // Timeline Mapping Operations
  async createTimelineMapping(mapping: Omit<TimelineMapping, '_id' | 'created_at' | 'updated_at'>): Promise<TimelineMapping> {
    const collection = this.getCollection<TimelineMapping>(COLLECTION_NAMES.TIMELINE_MAPPINGS);
    
    const document: Omit<TimelineMapping, '_id'> = {
      ...mapping,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const result = await collection.insertOne(document as TimelineMapping);
      const inserted = await collection.findOne({ _id: result.insertedId });
      
      if (!inserted) {
        throw new Error('Failed to retrieve inserted document');
      }

      logger.info('Timeline mapping created', {
        id: result.insertedId.toString(),
        circular_id: mapping.circular_id,
        organization_id: mapping.organization_id,
      });

      return inserted;
    } catch (error) {
      logger.error('Failed to create timeline mapping', {
        circular_id: mapping.circular_id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getTimelineMappingById(id: string): Promise<TimelineMapping | null> {
    const collection = this.getCollection<TimelineMapping>(COLLECTION_NAMES.TIMELINE_MAPPINGS);
    
    try {
      const objectId = new ObjectId(id);
      const result = await collection.findOne({ _id: objectId });
      return result;
    } catch (error) {
      logger.error('Failed to get timeline mapping by ID', {
        id,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async getTimelineMappings(
    filters: MongoFilterOptions = {},
    pagination: MongoPaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: TimelineMapping[]; total: number }> {
    const collection = this.getCollection<TimelineMapping>(COLLECTION_NAMES.TIMELINE_MAPPINGS);
    return this.findWithPagination(collection, filters, pagination);
  }

  async updateTimelineMapping(id: string, updates: Partial<TimelineMapping>): Promise<TimelineMapping | null> {
    const collection = this.getCollection<TimelineMapping>(COLLECTION_NAMES.TIMELINE_MAPPINGS);
    
    try {
      const objectId = new ObjectId(id);
      const updateDoc: UpdateFilter<TimelineMapping> = {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      };

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        updateDoc,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Failed to update timeline mapping', {
        id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Notification Log Operations
  async createNotificationLog(log: Omit<NotificationLog, '_id' | 'created_at'>): Promise<NotificationLog> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    
    const document: Omit<NotificationLog, '_id'> = {
      ...log,
      created_at: new Date(),
    };

    try {
      const result = await collection.insertOne(document as NotificationLog);
      const inserted = await collection.findOne({ _id: result.insertedId });
      
      if (!inserted) {
        throw new Error('Failed to retrieve inserted document');
      }

      logger.info('Notification log created', {
        id: result.insertedId.toString(),
        notification_id: log.notification_id,
        type: log.type,
      });

      return inserted;
    } catch (error) {
      logger.error('Failed to create notification log', {
        notification_id: log.notification_id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getNotificationLogById(id: string): Promise<NotificationLog | null> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    
    try {
      const objectId = new ObjectId(id);
      const result = await collection.findOne({ _id: objectId });
      return result;
    } catch (error) {
      logger.error('Failed to get notification log by ID', {
        id,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async getNotificationLogByNotificationId(notificationId: string): Promise<NotificationLog | null> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    
    try {
      const result = await collection.findOne({ notification_id: notificationId });
      return result;
    } catch (error) {
      logger.error('Failed to get notification log by notification ID', {
        notification_id: notificationId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async getNotificationLogs(
    filters: MongoFilterOptions = {},
    pagination: MongoPaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: NotificationLog[]; total: number }> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    return this.findWithPagination(collection, filters, pagination);
  }

  async updateNotificationLog(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog | null> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    
    try {
      const objectId = new ObjectId(id);
      const updateDoc: UpdateFilter<NotificationLog> = {
        $set: updates,
      };

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        updateDoc,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Failed to update notification log', {
        id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Aggregation Operations
  async aggregateCircularsByCategory(): Promise<Array<{ _id: string; count: number }>> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    try {
      const pipeline = [
        {
          $group: {
            _id: '$parsed_content.category',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();
      return result as Array<{ _id: string; count: number }>;
    } catch (error) {
      logger.error('Failed to aggregate circulars by category', error);
      throw error;
    }
  }

  async aggregateNotificationsByType(): Promise<Array<{ _id: string; count: number }>> {
    const collection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
    
    try {
      const pipeline = [
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();
      return result as Array<{ _id: string; count: number }>;
    } catch (error) {
      logger.error('Failed to aggregate notifications by type', error);
      throw error;
    }
  }

  // Text Search Operations
  async searchCircularContent(query: string, limit: number = 10): Promise<CircularContent[]> {
    const collection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
    
    try {
      const result = await collection
        .find({
          $text: { $search: query },
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .toArray();

      return result;
    } catch (error) {
      logger.error('Failed to search circular content', {
        query,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Bulk Operations
  async bulkInsert<T>(collectionName: string, documents: T[]): Promise<void> {
    if (documents.length === 0) return;

    const collection = this.getCollection<T>(collectionName);
    
    try {
      const result = await collection.insertMany(documents);
      logger.info('Bulk insert completed', {
        collection: collectionName,
        inserted: result.insertedCount,
        total: documents.length,
      });
    } catch (error) {
      logger.error('Bulk insert failed', {
        collection: collectionName,
        count: documents.length,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Index Management
  async createIndexes(): Promise<void> {
    try {
      // Circular Content Indexes
      const circularCollection = this.getCollection<CircularContent>(COLLECTION_NAMES.CIRCULAR_CONTENT);
      await circularCollection.createIndex({ circular_id: 1 }, { unique: true });
      await circularCollection.createIndex({ 'parsed_content.category': 1 });
      await circularCollection.createIndex({ 'nlp_analysis.topics': 1 });
      await circularCollection.createIndex({ created_at: -1 });

      // Timeline Mapping Indexes
      const timelineCollection = this.getCollection<TimelineMapping>(COLLECTION_NAMES.TIMELINE_MAPPINGS);
      await timelineCollection.createIndex({ circular_id: 1 });
      await timelineCollection.createIndex({ organization_id: 1 });
      await timelineCollection.createIndex({ created_at: -1 });

      // Notification Log Indexes
      const notificationCollection = this.getCollection<NotificationLog>(COLLECTION_NAMES.NOTIFICATION_LOGS);
      await notificationCollection.createIndex({ notification_id: 1 }, { unique: true });
      await notificationCollection.createIndex({ type: 1 });
      await notificationCollection.createIndex({ status: 1 });
      await notificationCollection.createIndex({ created_at: -1 });

      logger.info('MongoDB indexes created successfully');
    } catch (error) {
      logger.error('Failed to create MongoDB indexes', error);
      throw error;
    }
  }
}

export default MongoDBRepository;
