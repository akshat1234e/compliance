/**
 * Elasticsearch Repository
 * Data access layer for full-text search and analytics
 */

import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { logger } from '@utils/logger';
import { databaseManager } from '../connection';
import { SearchableCircular, SearchableRequirement, INDEX_NAMES } from '../models';

export interface SearchOptions {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  highlight?: boolean;
  fuzzy?: boolean;
}

export interface SearchResult<T> {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
    highlight?: Record<string, string[]>;
  }>;
  total: number;
  maxScore: number;
  aggregations?: Record<string, any>;
}

export interface IndexStats {
  indexName: string;
  documentCount: number;
  storeSize: string;
  health: string;
}

export class ElasticsearchRepository {
  private client: ElasticsearchClient;

  constructor() {
    this.client = databaseManager.getElasticsearch();
  }

  /**
   * Initialize indexes with proper mappings
   */
  async initializeIndexes(): Promise<void> {
    try {
      await this.createCircularsIndex();
      await this.createRequirementsIndex();
      logger.info('Elasticsearch indexes initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch indexes', error);
      throw error;
    }
  }

  /**
   * Create circulars index with mapping
   */
  private async createCircularsIndex(): Promise<void> {
    const indexName = INDEX_NAMES.CIRCULARS;
    
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  regulatory_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                circular_number: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'regulatory_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                content: {
                  type: 'text',
                  analyzer: 'regulatory_analyzer',
                },
                category: { type: 'keyword' },
                published_date: { type: 'date' },
                impact_level: { type: 'keyword' },
                affected_entities: { type: 'keyword' },
                keywords: { type: 'keyword' },
                topics: { type: 'keyword' },
                status: { type: 'keyword' },
                indexed_at: { type: 'date' },
              },
            },
          },
        });

        logger.info('Circulars index created', { index: indexName });
      }
    } catch (error) {
      logger.error('Failed to create circulars index', error);
      throw error;
    }
  }

  /**
   * Create requirements index with mapping
   */
  private async createRequirementsIndex(): Promise<void> {
    const indexName = INDEX_NAMES.REQUIREMENTS;
    
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  regulatory_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                circular_id: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'regulatory_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                description: {
                  type: 'text',
                  analyzer: 'regulatory_analyzer',
                },
                category: { type: 'keyword' },
                priority: { type: 'keyword' },
                applicable_entities: { type: 'keyword' },
                keywords: { type: 'keyword' },
                indexed_at: { type: 'date' },
              },
            },
          },
        });

        logger.info('Requirements index created', { index: indexName });
      }
    } catch (error) {
      logger.error('Failed to create requirements index', error);
      throw error;
    }
  }

  /**
   * Index a circular document
   */
  async indexCircular(circular: SearchableCircular): Promise<boolean> {
    try {
      const response = await this.client.index({
        index: INDEX_NAMES.CIRCULARS,
        id: circular.id,
        body: {
          ...circular,
          indexed_at: new Date(),
        },
      });

      logger.debug('Circular indexed', {
        id: circular.id,
        result: response.result,
      });

      return response.result === 'created' || response.result === 'updated';
    } catch (error) {
      logger.error('Failed to index circular', {
        id: circular.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Index a requirement document
   */
  async indexRequirement(requirement: SearchableRequirement): Promise<boolean> {
    try {
      const response = await this.client.index({
        index: INDEX_NAMES.REQUIREMENTS,
        id: requirement.id,
        body: {
          ...requirement,
          indexed_at: new Date(),
        },
      });

      logger.debug('Requirement indexed', {
        id: requirement.id,
        result: response.result,
      });

      return response.result === 'created' || response.result === 'updated';
    } catch (error) {
      logger.error('Failed to index requirement', {
        id: requirement.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Search circulars
   */
  async searchCirculars(options: SearchOptions): Promise<SearchResult<SearchableCircular>> {
    try {
      const {
        query,
        filters = {},
        page = 1,
        limit = 20,
        sortBy = '_score',
        sortOrder = 'desc',
        highlight = true,
        fuzzy = false,
      } = options;

      const from = (page - 1) * limit;

      // Build query
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Add text search
      if (query) {
        if (fuzzy) {
          searchQuery.bool.must.push({
            multi_match: {
              query,
              fields: ['title^3', 'content^2', 'keywords^2'],
              fuzziness: 'AUTO',
              operator: 'and',
            },
          });
        } else {
          searchQuery.bool.must.push({
            multi_match: {
              query,
              fields: ['title^3', 'content^2', 'keywords^2'],
              operator: 'and',
            },
          });
        }
      } else {
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          searchQuery.bool.filter.push({
            terms: { [field]: value },
          });
        } else {
          searchQuery.bool.filter.push({
            term: { [field]: value },
          });
        }
      });

      // Build search request
      const searchRequest: any = {
        index: INDEX_NAMES.CIRCULARS,
        body: {
          query: searchQuery,
          from,
          size: limit,
          sort: [{ [sortBy]: { order: sortOrder } }],
        },
      };

      // Add highlighting
      if (highlight) {
        searchRequest.body.highlight = {
          fields: {
            title: {},
            content: {
              fragment_size: 150,
              number_of_fragments: 3,
            },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        };
      }

      const response = await this.client.search(searchRequest);

      return {
        hits: response.body.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight,
        })),
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
      };
    } catch (error) {
      logger.error('Failed to search circulars', {
        query: options.query,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Search requirements
   */
  async searchRequirements(options: SearchOptions): Promise<SearchResult<SearchableRequirement>> {
    try {
      const {
        query,
        filters = {},
        page = 1,
        limit = 20,
        sortBy = '_score',
        sortOrder = 'desc',
        highlight = true,
        fuzzy = false,
      } = options;

      const from = (page - 1) * limit;

      // Build query
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Add text search
      if (query) {
        if (fuzzy) {
          searchQuery.bool.must.push({
            multi_match: {
              query,
              fields: ['title^3', 'description^2', 'keywords^2'],
              fuzziness: 'AUTO',
              operator: 'and',
            },
          });
        } else {
          searchQuery.bool.must.push({
            multi_match: {
              query,
              fields: ['title^3', 'description^2', 'keywords^2'],
              operator: 'and',
            },
          });
        }
      } else {
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          searchQuery.bool.filter.push({
            terms: { [field]: value },
          });
        } else {
          searchQuery.bool.filter.push({
            term: { [field]: value },
          });
        }
      });

      // Build search request
      const searchRequest: any = {
        index: INDEX_NAMES.REQUIREMENTS,
        body: {
          query: searchQuery,
          from,
          size: limit,
          sort: [{ [sortBy]: { order: sortOrder } }],
        },
      };

      // Add highlighting
      if (highlight) {
        searchRequest.body.highlight = {
          fields: {
            title: {},
            description: {
              fragment_size: 150,
              number_of_fragments: 3,
            },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        };
      }

      const response = await this.client.search(searchRequest);

      return {
        hits: response.body.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight,
        })),
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
      };
    } catch (error) {
      logger.error('Failed to search requirements', {
        query: options.query,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get aggregations for circulars
   */
  async getCircularAggregations(): Promise<Record<string, any>> {
    try {
      const response = await this.client.search({
        index: INDEX_NAMES.CIRCULARS,
        body: {
          size: 0,
          aggs: {
            categories: {
              terms: { field: 'category', size: 20 },
            },
            impact_levels: {
              terms: { field: 'impact_level', size: 10 },
            },
            affected_entities: {
              terms: { field: 'affected_entities', size: 20 },
            },
            monthly_distribution: {
              date_histogram: {
                field: 'published_date',
                calendar_interval: 'month',
              },
            },
          },
        },
      });

      return response.body.aggregations;
    } catch (error) {
      logger.error('Failed to get circular aggregations', error);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex<T>(indexName: string, documents: T[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      const body = documents.flatMap((doc: any) => [
        { index: { _index: indexName, _id: doc.id } },
        { ...doc, indexed_at: new Date() },
      ]);

      const response = await this.client.bulk({ body });

      if (response.body.errors) {
        const errorItems = response.body.items.filter((item: any) => item.index?.error);
        logger.error('Bulk index errors', {
          errors: errorItems.length,
          total: documents.length,
        });
      } else {
        logger.info('Bulk index completed', {
          index: indexName,
          indexed: documents.length,
        });
      }
    } catch (error) {
      logger.error('Failed to bulk index documents', {
        index: indexName,
        count: documents.length,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      const response = await this.client.delete({
        index: indexName,
        id,
      });

      return response.body.result === 'deleted';
    } catch (error) {
      logger.error('Failed to delete document', {
        index: indexName,
        id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<IndexStats[]> {
    try {
      const response = await this.client.indices.stats({
        index: Object.values(INDEX_NAMES),
      });

      const stats: IndexStats[] = [];

      Object.entries(response.body.indices).forEach(([indexName, indexData]: [string, any]) => {
        stats.push({
          indexName,
          documentCount: indexData.total.docs.count,
          storeSize: indexData.total.store.size_in_bytes,
          health: 'green', // Simplified - would need cluster health API for real status
        });
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get index stats', error);
      return [];
    }
  }

  /**
   * Refresh indexes
   */
  async refreshIndexes(): Promise<void> {
    try {
      await this.client.indices.refresh({
        index: Object.values(INDEX_NAMES),
      });

      logger.info('Indexes refreshed');
    } catch (error) {
      logger.error('Failed to refresh indexes', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.cluster.health();
      return response.body.status === 'green' || response.body.status === 'yellow';
    } catch (error) {
      logger.error('Elasticsearch health check failed', error);
      return false;
    }
  }
}

export default ElasticsearchRepository;
