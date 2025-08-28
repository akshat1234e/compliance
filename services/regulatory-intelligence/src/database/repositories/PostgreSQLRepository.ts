/**
 * PostgreSQL Repository
 * Data access layer for relational data operations
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '@utils/logger';
import { databaseManager } from '../connection';
import {
  Organization,
  User,
  RBICircular,
  ComplianceRequirement,
  ComplianceStatus,
  ImpactAssessment,
  TABLE_NAMES,
} from '../models';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface FilterOptions {
  [key: string]: any;
}

export class PostgreSQLRepository {
  private pool: Pool;

  constructor() {
    this.pool = databaseManager.getPostgreSQL();
  }

  /**
   * Generic query execution with error handling
   */
  private async executeQuery<T>(
    query: string,
    params: any[] = [],
    client?: PoolClient
  ): Promise<T[]> {
    const queryClient = client || this.pool;
    
    try {
      const startTime = Date.now();
      const result = await queryClient.query(query, params);
      const duration = Date.now() - startTime;

      logger.debug('SQL query executed', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        params: params.length,
        rows: result.rowCount,
        duration: `${duration}ms`,
      });

      return result.rows;
    } catch (error) {
      logger.error('SQL query failed', {
        query: query.substring(0, 100),
        params,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: FilterOptions): { clause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${key} = ANY(ARRAY[${placeholders}])`);
          params.push(...value);
        } else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${key} ILIKE $${paramIndex++}`);
          params.push(value);
        } else {
          conditions.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    });

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params };
  }

  // Organization Operations
  async createOrganization(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    const query = `
      INSERT INTO ${TABLE_NAMES.ORGANIZATIONS} (
        name, type, size, license_number, rbi_registration_number,
        address, contact, compliance_maturity, risk_profile, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const params = [
      organization.name,
      organization.type,
      organization.size,
      organization.license_number,
      organization.rbi_registration_number,
      JSON.stringify(organization.address),
      JSON.stringify(organization.contact),
      organization.compliance_maturity,
      organization.risk_profile,
      organization.status,
    ];

    const [result] = await this.executeQuery<Organization>(query, params);
    return result;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const query = `SELECT * FROM ${TABLE_NAMES.ORGANIZATIONS} WHERE id = $1`;
    const [result] = await this.executeQuery<Organization>(query, [id]);
    return result || null;
  }

  async getOrganizations(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: Organization[]; total: number }> {
    const { clause, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ${TABLE_NAMES.ORGANIZATIONS} ${clause}`;
    const [countResult] = await this.executeQuery<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.count);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAMES.ORGANIZATIONS} ${clause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const data = await this.executeQuery<Organization>(dataQuery, [...params, pagination.limit, offset]);

    return { data, total };
  }

  // RBI Circular Operations
  async createCircular(circular: Omit<RBICircular, 'id' | 'created_at' | 'updated_at'>): Promise<RBICircular> {
    const query = `
      INSERT INTO ${TABLE_NAMES.RBI_CIRCULARS} (
        circular_number, title, category, sub_category, published_date,
        effective_date, source_url, content_hash, impact_level,
        affected_entities, status, superseded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const params = [
      circular.circular_number,
      circular.title,
      circular.category,
      circular.sub_category,
      circular.published_date,
      circular.effective_date,
      circular.source_url,
      circular.content_hash,
      circular.impact_level,
      circular.affected_entities,
      circular.status,
      circular.superseded_by,
    ];

    const [result] = await this.executeQuery<RBICircular>(query, params);
    return result;
  }

  async getCircularById(id: string): Promise<RBICircular | null> {
    const query = `SELECT * FROM ${TABLE_NAMES.RBI_CIRCULARS} WHERE id = $1`;
    const [result] = await this.executeQuery<RBICircular>(query, [id]);
    return result || null;
  }

  async getCircularByNumber(circularNumber: string): Promise<RBICircular | null> {
    const query = `SELECT * FROM ${TABLE_NAMES.RBI_CIRCULARS} WHERE circular_number = $1`;
    const [result] = await this.executeQuery<RBICircular>(query, [circularNumber]);
    return result || null;
  }

  async getCirculars(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: RBICircular[]; total: number }> {
    const { clause, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'published_date';
    const sortOrder = pagination.sortOrder || 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ${TABLE_NAMES.RBI_CIRCULARS} ${clause}`;
    const [countResult] = await this.executeQuery<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.count);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAMES.RBI_CIRCULARS} ${clause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const data = await this.executeQuery<RBICircular>(dataQuery, [...params, pagination.limit, offset]);

    return { data, total };
  }

  async updateCircular(id: string, updates: Partial<RBICircular>): Promise<RBICircular | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE ${TABLE_NAMES.RBI_CIRCULARS}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const params = [id, ...Object.values(updates)];
    const [result] = await this.executeQuery<RBICircular>(query, params);
    return result || null;
  }

  // Compliance Requirement Operations
  async createRequirement(requirement: Omit<ComplianceRequirement, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceRequirement> {
    const query = `
      INSERT INTO ${TABLE_NAMES.COMPLIANCE_REQUIREMENTS} (
        circular_id, requirement_code, title, description, category,
        priority, frequency, applicable_entities, deadline, is_mandatory
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const params = [
      requirement.circular_id,
      requirement.requirement_code,
      requirement.title,
      requirement.description,
      requirement.category,
      requirement.priority,
      requirement.frequency,
      requirement.applicable_entities,
      requirement.deadline,
      requirement.is_mandatory,
    ];

    const [result] = await this.executeQuery<ComplianceRequirement>(query, params);
    return result;
  }

  async getRequirementsByCircularId(circularId: string): Promise<ComplianceRequirement[]> {
    const query = `SELECT * FROM ${TABLE_NAMES.COMPLIANCE_REQUIREMENTS} WHERE circular_id = $1 ORDER BY priority DESC, created_at ASC`;
    return this.executeQuery<ComplianceRequirement>(query, [circularId]);
  }

  async getRequirements(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: ComplianceRequirement[]; total: number }> {
    const { clause, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ${TABLE_NAMES.COMPLIANCE_REQUIREMENTS} ${clause}`;
    const [countResult] = await this.executeQuery<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.count);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAMES.COMPLIANCE_REQUIREMENTS} ${clause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const data = await this.executeQuery<ComplianceRequirement>(dataQuery, [...params, pagination.limit, offset]);

    return { data, total };
  }

  // Impact Assessment Operations
  async createImpactAssessment(assessment: Omit<ImpactAssessment, 'id' | 'created_at' | 'updated_at'>): Promise<ImpactAssessment> {
    const query = `
      INSERT INTO ${TABLE_NAMES.IMPACT_ASSESSMENTS} (
        circular_id, organization_id, assessment_type, overall_impact,
        impact_areas, estimated_cost, timeline_estimate, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const params = [
      assessment.circular_id,
      assessment.organization_id,
      assessment.assessment_type,
      JSON.stringify(assessment.overall_impact),
      JSON.stringify(assessment.impact_areas),
      JSON.stringify(assessment.estimated_cost),
      JSON.stringify(assessment.timeline_estimate),
      assessment.confidence_score,
    ];

    const [result] = await this.executeQuery<ImpactAssessment>(query, params);
    return result;
  }

  async getImpactAssessmentById(id: string): Promise<ImpactAssessment | null> {
    const query = `SELECT * FROM ${TABLE_NAMES.IMPACT_ASSESSMENTS} WHERE id = $1`;
    const [result] = await this.executeQuery<ImpactAssessment>(query, [id]);
    return result || null;
  }

  async getImpactAssessments(
    filters: FilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ data: ImpactAssessment[]; total: number }> {
    const { clause, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ${TABLE_NAMES.IMPACT_ASSESSMENTS} ${clause}`;
    const [countResult] = await this.executeQuery<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.count);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAMES.IMPACT_ASSESSMENTS} ${clause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const data = await this.executeQuery<ImpactAssessment>(dataQuery, [...params, pagination.limit, offset]);

    return { data, total };
  }

  // Transaction support
  async executeTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return databaseManager.executeTransaction(callback);
  }

  // Bulk operations
  async bulkInsert<T>(tableName: string, records: T[], columns: string[]): Promise<void> {
    if (records.length === 0) return;

    const placeholders = records
      .map((_, recordIndex) =>
        `(${columns.map((_, colIndex) => `$${recordIndex * columns.length + colIndex + 1}`).join(', ')})`
      )
      .join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;

    const params = records.flatMap(record =>
      columns.map(col => (record as any)[col])
    );

    await this.executeQuery(query, params);
  }
}

export default PostgreSQLRepository;
