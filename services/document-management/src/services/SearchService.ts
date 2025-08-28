/**
 * Document Search Service
 * Elasticsearch-powered full-text search and indexing service
 */

import { config } from '@config/index';
import { Client } from '@elastic/elasticsearch';
import { logger } from '@utils/logger';
import { EventEmitter } from 'events';

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  extractedText?: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string;
    organizationId: string;
    tags: string[];
    categories: string[];
    language?: string;
    checksum: string;
  };
  classifications?: Array<{
    category: string;
    confidence: number;
    subcategory?: string;
  }>;
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  };
  versions?: Array<{
    version: number;
    createdAt: string;
    createdBy: string;
  }>;
}

export interface SearchQuery {
  query?: string;
  filters?: {
    fileType?: string[];
    categories?: string[];
    tags?: string[];
    uploadedBy?: string[];
    organizationId?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
    sizeRange?: {
      min?: number;
      max?: number;
    };
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination?: {
    page: number;
    size: number;
  };
  highlight?: boolean;
  aggregations?: string[];
}

export interface SearchResult {
  documents: Array<{
    document: SearchDocument;
    score: number;
    highlights?: Record<string, string[]>;
  }>;
  total: number;
  page: number;
  size: number;
  aggregations?: Record<string, any>;
  took: number;
}

export interface SearchSuggestion {
  text: string;
  score: number;
  type: 'completion' | 'phrase' | 'term';
}

export class SearchService extends EventEmitter {
  private client: Client;
  private indexName: string;
  private isInitialized = false;

  constructor() {
    super();
    this.indexName = config.elasticsearch.indexName || 'documents';
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Search service already initialized');
      return;
    }

    try {
      logger.info('Initializing Document Search Service...');

      // Initialize Elasticsearch client
      this.client = new Client({
        node: config.elasticsearch.node,
        auth: config.elasticsearch.auth ? {
          username: config.elasticsearch.auth.username,
          password: config.elasticsearch.auth.password,
        } : undefined,
        tls: config.elasticsearch.tls ? {
          ca: config.elasticsearch.tls.ca,
          cert: config.elasticsearch.tls.cert,
          key: config.elasticsearch.tls.key,
          rejectUnauthorized: config.elasticsearch.tls.rejectUnauthorized !== false,
        } : undefined,
      });

      // Test connection
      await this.client.ping();

      // Create index if it doesn't exist
      await this.createIndexIfNotExists();

      this.isInitialized = true;
      logger.info('Document Search Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Document Search Service', error);
      throw error;
    }
  }

  private async createIndexIfNotExists(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  document_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                      'lowercase',
                      'stop',
                      'snowball',
                      'word_delimiter',
                    ],
                  },
                  autocomplete_analyzer: {
                    type: 'custom',
                    tokenizer: 'keyword',
                    filter: ['lowercase', 'edge_ngram'],
                  },
                },
                filter: {
                  edge_ngram: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20,
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'document_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    autocomplete: {
                      type: 'text',
                      analyzer: 'autocomplete_analyzer',
                    },
                  },
                },
                content: {
                  type: 'text',
                  analyzer: 'document_analyzer',
                },
                extractedText: {
                  type: 'text',
                  analyzer: 'document_analyzer',
                },
                'metadata.fileName': {
                  type: 'text',
                  analyzer: 'document_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                'metadata.fileType': { type: 'keyword' },
                'metadata.fileSize': { type: 'long' },
                'metadata.mimeType': { type: 'keyword' },
                'metadata.uploadedAt': { type: 'date' },
                'metadata.uploadedBy': { type: 'keyword' },
                'metadata.organizationId': { type: 'keyword' },
                'metadata.tags': { type: 'keyword' },
                'metadata.categories': { type: 'keyword' },
                'metadata.language': { type: 'keyword' },
                'metadata.checksum': { type: 'keyword' },
                'classifications.category': { type: 'keyword' },
                'classifications.confidence': { type: 'float' },
                'classifications.subcategory': { type: 'keyword' },
                'permissions.read': { type: 'keyword' },
                'permissions.write': { type: 'keyword' },
                'permissions.delete': { type: 'keyword' },
                'versions.version': { type: 'integer' },
                'versions.createdAt': { type: 'date' },
                'versions.createdBy': { type: 'keyword' },
              },
            },
          },
        });

        logger.info('Created Elasticsearch index', { indexName: this.indexName });
      }
    } catch (error) {
      logger.error('Failed to create Elasticsearch index', { indexName: this.indexName, error });
      throw error;
    }
  }

  public async indexDocument(document: SearchDocument): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      await this.client.index({
        index: this.indexName,
        id: document.id,
        body: document,
        refresh: 'wait_for',
      });

      logger.info('Document indexed successfully', {
        documentId: document.id,
        title: document.title,
        indexName: this.indexName,
      });

      this.emit('documentIndexed', document);

    } catch (error) {
      logger.error('Failed to index document', { documentId: document.id, error });
      throw error;
    }
  }

  public async updateDocument(documentId: string, updates: Partial<SearchDocument>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: updates,
        },
        refresh: 'wait_for',
      });

      logger.info('Document updated successfully', {
        documentId,
        indexName: this.indexName,
      });

      this.emit('documentUpdated', { documentId, updates });

    } catch (error) {
      logger.error('Failed to update document', { documentId, error });
      throw error;
    }
  }

  public async deleteDocument(documentId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      await this.client.delete({
        index: this.indexName,
        id: documentId,
        refresh: 'wait_for',
      });

      logger.info('Document deleted from index', {
        documentId,
        indexName: this.indexName,
      });

      this.emit('documentDeleted', documentId);

    } catch (error) {
      logger.error('Failed to delete document from index', { documentId, error });
      throw error;
    }
  }

  public async search(searchQuery: SearchQuery): Promise<SearchResult> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      const { query, filters, sort, pagination, highlight, aggregations } = searchQuery;

      // Build Elasticsearch query
      const esQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Add text query
      if (query) {
        esQuery.bool.must.push({
          multi_match: {
            query,
            fields: [
              'title^3',
              'content^2',
              'extractedText^2',
              'metadata.fileName^2',
              'metadata.tags',
              'metadata.categories',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      } else {
        esQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters) {
        if (filters.fileType?.length) {
          esQuery.bool.filter.push({
            terms: { 'metadata.fileType': filters.fileType },
          });
        }

        if (filters.categories?.length) {
          esQuery.bool.filter.push({
            terms: { 'metadata.categories': filters.categories },
          });
        }

        if (filters.tags?.length) {
          esQuery.bool.filter.push({
            terms: { 'metadata.tags': filters.tags },
          });
        }

        if (filters.uploadedBy?.length) {
          esQuery.bool.filter.push({
            terms: { 'metadata.uploadedBy': filters.uploadedBy },
          });
        }

        if (filters.organizationId) {
          esQuery.bool.filter.push({
            term: { 'metadata.organizationId': filters.organizationId },
          });
        }

        if (filters.dateRange) {
          const dateFilter: any = { range: { 'metadata.uploadedAt': {} } };
          if (filters.dateRange.from) {
            dateFilter.range['metadata.uploadedAt'].gte = filters.dateRange.from;
          }
          if (filters.dateRange.to) {
            dateFilter.range['metadata.uploadedAt'].lte = filters.dateRange.to;
          }
          esQuery.bool.filter.push(dateFilter);
        }

        if (filters.sizeRange) {
          const sizeFilter: any = { range: { 'metadata.fileSize': {} } };
          if (filters.sizeRange.min !== undefined) {
            sizeFilter.range['metadata.fileSize'].gte = filters.sizeRange.min;
          }
          if (filters.sizeRange.max !== undefined) {
            sizeFilter.range['metadata.fileSize'].lte = filters.sizeRange.max;
          }
          esQuery.bool.filter.push(sizeFilter);
        }
      }

      // Build search request
      const searchRequest: any = {
        index: this.indexName,
        body: {
          query: esQuery,
          from: pagination ? (pagination.page - 1) * pagination.size : 0,
          size: pagination?.size || 20,
        },
      };

      // Add sorting
      if (sort?.length) {
        searchRequest.body.sort = sort.map(s => ({
          [s.field]: { order: s.order },
        }));
      } else {
        searchRequest.body.sort = [{ _score: { order: 'desc' } }];
      }

      // Add highlighting
      if (highlight) {
        searchRequest.body.highlight = {
          fields: {
            title: {},
            content: {},
            extractedText: {},
            'metadata.fileName': {},
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        };
      }

      // Add aggregations
      if (aggregations?.length) {
        searchRequest.body.aggs = {};
        for (const agg of aggregations) {
          searchRequest.body.aggs[agg] = {
            terms: { field: `metadata.${agg}` },
          };
        }
      }

      const response = await this.client.search(searchRequest);

      // Process results
      const documents = response.body.hits.hits.map((hit: any) => ({
        document: hit._source,
        score: hit._score,
        highlights: hit.highlight,
      }));

      const result: SearchResult = {
        documents,
        total: response.body.hits.total.value,
        page: pagination?.page || 1,
        size: pagination?.size || 20,
        took: response.body.took,
      };

      if (response.body.aggregations) {
        result.aggregations = response.body.aggregations;
      }

      logger.info('Search completed', {
        query,
        total: result.total,
        took: result.took,
        page: result.page,
      });

      return result;

    } catch (error) {
      logger.error('Search failed', { searchQuery, error });
      throw error;
    }
  }

  public async suggest(text: string, field: string = 'title'): Promise<SearchSuggestion[]> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            text_suggest: {
              text,
              completion: {
                field: `${field}.autocomplete`,
                size: 10,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const suggestions: SearchSuggestion[] = [];

      if (response.body.suggest?.text_suggest) {
        for (const suggestion of response.body.suggest.text_suggest) {
          for (const option of suggestion.options) {
            suggestions.push({
              text: option.text,
              score: option._score,
              type: 'completion',
            });
          }
        }
      }

      return suggestions;

    } catch (error) {
      logger.error('Suggestion failed', { text, field, error });
      throw error;
    }
  }

  public async getDocumentById(documentId: string): Promise<SearchDocument | null> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      const response = await this.client.get({
        index: this.indexName,
        id: documentId,
      });

      return response.body._source || null;

    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      logger.error('Failed to get document by ID', { documentId, error });
      throw error;
    }
  }

  public async bulkIndex(documents: SearchDocument[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      const body = documents.flatMap(doc => [
        { index: { _index: this.indexName, _id: doc.id } },
        doc,
      ]);

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for',
      });

      if (response.body.errors) {
        const errorItems = response.body.items.filter((item: any) =>
          item.index?.error || item.create?.error || item.update?.error || item.delete?.error
        );
        logger.warn('Bulk indexing completed with errors', {
          totalDocuments: documents.length,
          errorCount: errorItems.length,
          errors: errorItems,
        });
      } else {
        logger.info('Bulk indexing completed successfully', {
          totalDocuments: documents.length,
          took: response.body.took,
        });
      }

      this.emit('bulkIndexed', { documents, errors: response.body.errors });

    } catch (error) {
      logger.error('Bulk indexing failed', { documentCount: documents.length, error });
      throw error;
    }
  }

  public async reindex(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      logger.info('Starting reindex operation...');

      // Create new index with timestamp
      const newIndexName = `${this.indexName}_${Date.now()}`;

      await this.client.indices.create({
        index: newIndexName,
        body: (await this.client.indices.get({ index: this.indexName })).body[this.indexName],
      });

      // Reindex data
      await this.client.reindex({
        body: {
          source: { index: this.indexName },
          dest: { index: newIndexName },
        },
        wait_for_completion: true,
      });

      // Update alias
      await this.client.indices.updateAliases({
        body: {
          actions: [
            { remove: { index: this.indexName, alias: `${this.indexName}_current` } },
            { add: { index: newIndexName, alias: `${this.indexName}_current` } },
          ],
        },
      });

      // Delete old index
      await this.client.indices.delete({ index: this.indexName });

      logger.info('Reindex operation completed', {
        oldIndex: this.indexName,
        newIndex: newIndexName,
      });

      this.emit('reindexCompleted', { oldIndex: this.indexName, newIndex: newIndexName });

    } catch (error) {
      logger.error('Reindex operation failed', { error });
      throw error;
    }
  }

  public async getIndexStats(): Promise<{
    documentCount: number;
    indexSize: string;
    health: string;
    shards: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      const [statsResponse, healthResponse] = await Promise.all([
        this.client.indices.stats({ index: this.indexName }),
        this.client.cluster.health({ index: this.indexName }),
      ]);

      const stats = statsResponse.body.indices[this.indexName];
      const health = healthResponse.body;

      return {
        documentCount: stats.total.docs.count,
        indexSize: `${Math.round(stats.total.store.size_in_bytes / 1024 / 1024)} MB`,
        health: health.status,
        shards: health.active_shards,
      };

    } catch (error) {
      logger.error('Failed to get index stats', { error });
      throw error;
    }
  }

  public async clearIndex(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: { match_all: {} },
        },
        refresh: true,
      });

      logger.info('Index cleared successfully', { indexName: this.indexName });
      this.emit('indexCleared');

    } catch (error) {
      logger.error('Failed to clear index', { indexName: this.indexName, error });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Document Search Service...');

    if (this.client) {
      await this.client.close();
    }

    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Document Search Service shutdown completed');
  }
}

export default SearchService;
