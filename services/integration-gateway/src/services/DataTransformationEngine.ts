/**
 * Data Transformation Engine
 * Configurable data transformation engine for format conversion between systems
 */

import { logger } from '@utils/logger';
import { EventEmitter } from 'events';

export interface TransformationRule {
  id: string;
  name: string;
  description: string;
  sourceFormat: string;
  targetFormat: string;
  mappings: FieldMapping[];
  conditions?: TransformationCondition[];
  validations?: ValidationRule[];
  isActive: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformationType: 'DIRECT' | 'FUNCTION' | 'LOOKUP' | 'CONDITIONAL' | 'AGGREGATE';
  transformationFunction?: string;
  parameters?: Record<string, any>;
  defaultValue?: any;
  isRequired: boolean;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'OBJECT' | 'ARRAY';
  format?: string;
}

export interface TransformationCondition {
  id: string;
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN';
  value: any;
  action: 'INCLUDE' | 'EXCLUDE' | 'TRANSFORM' | 'VALIDATE';
  parameters?: Record<string, any>;
}

export interface ValidationRule {
  id: string;
  field: string;
  validationType: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'LENGTH' | 'CUSTOM';
  parameters: Record<string, any>;
  errorMessage: string;
  severity: 'ERROR' | 'WARNING';
}

export interface TransformationRequest {
  ruleId: string;
  sourceData: any;
  context?: Record<string, any>;
  options?: {
    validateInput?: boolean;
    validateOutput?: boolean;
    includeMetadata?: boolean;
    strictMode?: boolean;
  };
}

export interface TransformationResult {
  success: boolean;
  transformedData?: any;
  errors?: Array<{
    field: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
    code: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  metadata?: {
    ruleId: string;
    ruleName: string;
    sourceFormat: string;
    targetFormat: string;
    processingTime: number;
    fieldsTransformed: number;
    validationsPassed: number;
    validationsFailed: number;
  };
}

export interface LookupTable {
  id: string;
  name: string;
  description: string;
  mappings: Record<string, any>;
  isActive: boolean;
  cacheEnabled: boolean;
  ttl?: number;
}

export class DataTransformationEngine extends EventEmitter {
  private isInitialized = false;
  private transformationRules: Map<string, TransformationRule> = new Map();
  private lookupTables: Map<string, LookupTable> = new Map();
  private functionRegistry: Map<string, Function> = new Map();
  private cache: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeBuiltInFunctions();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Data Transformation Engine already initialized');
      return;
    }

    try {
      logger.info('Initializing Data Transformation Engine...');

      // Load transformation rules from database/config
      await this.loadTransformationRules();

      // Load lookup tables
      await this.loadLookupTables();

      // Initialize cache cleanup
      this.setupCacheCleanup();

      this.isInitialized = true;
      logger.info('Data Transformation Engine initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Data Transformation Engine', error);
      throw error;
    }
  }

  private initializeBuiltInFunctions(): void {
    // String functions
    this.functionRegistry.set('toUpperCase', (value: string) => value?.toUpperCase());
    this.functionRegistry.set('toLowerCase', (value: string) => value?.toLowerCase());
    this.functionRegistry.set('trim', (value: string) => value?.trim());
    this.functionRegistry.set('substring', (value: string, start: number, end?: number) => value?.substring(start, end));
    this.functionRegistry.set('replace', (value: string, search: string, replace: string) => value?.replace(new RegExp(search, 'g'), replace));
    this.functionRegistry.set('padLeft', (value: string, length: number, char: string = '0') => value?.padStart(length, char));
    this.functionRegistry.set('padRight', (value: string, length: number, char: string = ' ') => value?.padEnd(length, char));

    // Number functions
    this.functionRegistry.set('toNumber', (value: any) => parseFloat(value) || 0);
    this.functionRegistry.set('toInteger', (value: any) => parseInt(value) || 0);
    this.functionRegistry.set('round', (value: number, decimals: number = 0) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals));
    this.functionRegistry.set('abs', (value: number) => Math.abs(value));
    this.functionRegistry.set('formatCurrency', (value: number, currency: string = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value));

    // Date functions
    this.functionRegistry.set('formatDate', (value: string | Date, format: string = 'YYYY-MM-DD') => {
      const date = new Date(value);
      return this.formatDateString(date, format);
    });
    this.functionRegistry.set('addDays', (value: string | Date, days: number) => {
      const date = new Date(value);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });
    this.functionRegistry.set('getCurrentDate', () => new Date().toISOString().split('T')[0]);
    this.functionRegistry.set('getCurrentTimestamp', () => new Date().toISOString());

    // Array functions
    this.functionRegistry.set('join', (value: any[], separator: string = ',') => value?.join(separator));
    this.functionRegistry.set('split', (value: string, separator: string = ',') => value?.split(separator));
    this.functionRegistry.set('first', (value: any[]) => value?.[0]);
    this.functionRegistry.set('last', (value: any[]) => value?.[value.length - 1]);
    this.functionRegistry.set('length', (value: any[] | string) => value?.length || 0);

    // Conditional functions
    this.functionRegistry.set('ifNull', (value: any, defaultValue: any) => value != null ? value : defaultValue);
    this.functionRegistry.set('ifEmpty', (value: any, defaultValue: any) => (value != null && value !== '') ? value : defaultValue);
    this.functionRegistry.set('conditional', (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue);

    // Banking specific functions
    this.functionRegistry.set('formatAccountNumber', (value: string) => {
      // Format account number with standard spacing
      return value?.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    this.functionRegistry.set('validateIFSC', (value: string) => {
      // Basic IFSC validation
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      return ifscRegex.test(value);
    });
    this.functionRegistry.set('formatPAN', (value: string) => {
      // Format PAN number
      return value?.toUpperCase().replace(/(.{5})(.{4})(.{1})/, '$1$2$3');
    });
    this.functionRegistry.set('maskAccountNumber', (value: string, visibleDigits: number = 4) => {
      if (!value || value.length <= visibleDigits) return value;
      const masked = '*'.repeat(value.length - visibleDigits);
      return masked + value.slice(-visibleDigits);
    });

    logger.info(`Initialized ${this.functionRegistry.size} built-in transformation functions`);
  }

  public async transform(request: TransformationRequest): Promise<TransformationResult> {
    if (!this.isInitialized) {
      throw new Error('Data Transformation Engine not initialized');
    }

    const startTime = Date.now();

    try {
      const { ruleId, sourceData, context, options } = request;

      const rule = this.transformationRules.get(ruleId);
      if (!rule) {
        throw new Error(`Transformation rule not found: ${ruleId}`);
      }

      if (!rule.isActive) {
        throw new Error(`Transformation rule is inactive: ${ruleId}`);
      }

      logger.info('Starting data transformation', {
        ruleId,
        ruleName: rule.name,
        sourceFormat: rule.sourceFormat,
        targetFormat: rule.targetFormat,
      });

      // Validate input if requested
      if (options?.validateInput) {
        const inputValidation = await this.validateData(sourceData, rule.validations || [], 'input');
        if (inputValidation.errors.length > 0) {
          return {
            success: false,
            errors: inputValidation.errors,
            warnings: inputValidation.warnings,
          };
        }
      }

      // Check conditions
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionResult = this.evaluateConditions(sourceData, rule.conditions);
        if (!conditionResult.shouldProcess) {
          return {
            success: false,
            errors: [{
              field: 'conditions',
              message: 'Transformation conditions not met',
              severity: 'ERROR',
              code: 'CONDITION_FAILED',
            }],
          };
        }
      }

      // Perform transformation
      const transformedData = await this.performTransformation(sourceData, rule, context);

      // Validate output if requested
      if (options?.validateOutput) {
        const outputValidation = await this.validateData(transformedData, rule.validations || [], 'output');
        if (outputValidation.errors.length > 0 && options?.strictMode) {
          return {
            success: false,
            errors: outputValidation.errors,
            warnings: outputValidation.warnings,
          };
        }
      }

      const processingTime = Date.now() - startTime;

      const result: TransformationResult = {
        success: true,
        transformedData,
        metadata: options?.includeMetadata ? {
          ruleId,
          ruleName: rule.name,
          sourceFormat: rule.sourceFormat,
          targetFormat: rule.targetFormat,
          processingTime,
          fieldsTransformed: rule.mappings.length,
          validationsPassed: 0, // TODO: Calculate actual values
          validationsFailed: 0,
        } : undefined,
      };

      logger.info('Data transformation completed', {
        ruleId,
        success: true,
        processingTime,
      });

      this.emit('transformationCompleted', {
        ruleId,
        success: true,
        processingTime,
      });

      return result;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('Data transformation failed', {
        ruleId: request.ruleId,
        error: error.message,
        processingTime,
      });

      this.emit('transformationFailed', {
        ruleId: request.ruleId,
        error: error.message,
        processingTime,
      });

      return {
        success: false,
        errors: [{
          field: 'system',
          message: error.message,
          severity: 'ERROR',
          code: 'TRANSFORMATION_ERROR',
        }],
      };
    }
  }

  private async performTransformation(sourceData: any, rule: TransformationRule, context?: Record<string, any>): Promise<any> {
    const result: any = {};

    for (const mapping of rule.mappings) {
      try {
        const sourceValue = this.getNestedValue(sourceData, mapping.sourceField);
        let transformedValue: any;

        switch (mapping.transformationType) {
          case 'DIRECT':
            transformedValue = sourceValue;
            break;

          case 'FUNCTION':
            transformedValue = await this.applyFunction(sourceValue, mapping.transformationFunction!, mapping.parameters);
            break;

          case 'LOOKUP':
            transformedValue = await this.performLookup(sourceValue, mapping.parameters);
            break;

          case 'CONDITIONAL':
            transformedValue = this.applyConditionalTransformation(sourceValue, sourceData, mapping.parameters);
            break;

          case 'AGGREGATE':
            transformedValue = this.performAggregation(sourceData, mapping.parameters);
            break;

          default:
            transformedValue = sourceValue;
        }

        // Apply default value if needed
        if (transformedValue == null && mapping.defaultValue != null) {
          transformedValue = mapping.defaultValue;
        }

        // Type conversion
        transformedValue = this.convertDataType(transformedValue, mapping.dataType, mapping.format);

        // Set the transformed value
        this.setNestedValue(result, mapping.targetField, transformedValue);

      } catch (error: any) {
        logger.warn('Field transformation failed', {
          sourceField: mapping.sourceField,
          targetField: mapping.targetField,
          error: error.message,
        });

        if (mapping.isRequired) {
          throw new Error(`Required field transformation failed: ${mapping.sourceField} -> ${mapping.targetField}: ${error.message}`);
        }
      }
    }

    return result;
  }

  private async applyFunction(value: any, functionName: string, parameters?: Record<string, any>): Promise<any> {
    const func = this.functionRegistry.get(functionName);
    if (!func) {
      throw new Error(`Unknown transformation function: ${functionName}`);
    }

    try {
      if (parameters && Object.keys(parameters).length > 0) {
        const args = [value, ...Object.values(parameters)];
        return func(...args);
      } else {
        return func(value);
      }
    } catch (error: any) {
      throw new Error(`Function execution failed: ${functionName}: ${error.message}`);
    }
  }

  private async performLookup(value: any, parameters?: Record<string, any>): Promise<any> {
    if (!parameters?.tableId) {
      throw new Error('Lookup table ID not specified');
    }

    const lookupTable = this.lookupTables.get(parameters.tableId);
    if (!lookupTable) {
      throw new Error(`Lookup table not found: ${parameters.tableId}`);
    }

    if (!lookupTable.isActive) {
      throw new Error(`Lookup table is inactive: ${parameters.tableId}`);
    }

    const lookupKey = String(value);
    const lookupValue = lookupTable.mappings[lookupKey];

    if (lookupValue != null) {
      return lookupValue;
    }

    // Return default value if specified
    if (parameters.defaultValue != null) {
      return parameters.defaultValue;
    }

    // Return original value if no mapping found and no default
    return value;
  }

  private applyConditionalTransformation(value: any, sourceData: any, parameters?: Record<string, any>): any {
    if (!parameters?.conditions) {
      return value;
    }

    for (const condition of parameters.conditions) {
      if (this.evaluateCondition(sourceData, condition)) {
        return condition.value;
      }
    }

    return parameters.defaultValue != null ? parameters.defaultValue : value;
  }

  private performAggregation(sourceData: any, parameters?: Record<string, any>): any {
    if (!parameters?.operation || !parameters?.fields) {
      throw new Error('Aggregation operation and fields must be specified');
    }

    const values = parameters.fields.map((field: string) => this.getNestedValue(sourceData, field))
                                   .filter((val: any) => val != null);

    switch (parameters.operation) {
      case 'SUM':
        return values.reduce((sum: number, val: any) => sum + parseFloat(val), 0);
      case 'AVG':
        return values.length > 0 ? values.reduce((sum: number, val: any) => sum + parseFloat(val), 0) / values.length : 0;
      case 'MIN':
        return Math.min(...values.map((val: any) => parseFloat(val)));
      case 'MAX':
        return Math.max(...values.map((val: any) => parseFloat(val)));
      case 'COUNT':
        return values.length;
      case 'CONCAT':
        return values.join(parameters.separator || '');
      default:
        throw new Error(`Unknown aggregation operation: ${parameters.operation}`);
    }
  }

  private evaluateConditions(data: any, conditions: TransformationCondition[]): { shouldProcess: boolean; failedConditions: string[] } {
    const failedConditions: string[] = [];

    for (const condition of conditions) {
      if (!this.evaluateCondition(data, condition)) {
        failedConditions.push(condition.id);
      }
    }

    return {
      shouldProcess: failedConditions.length === 0,
      failedConditions,
    };
  }

  private evaluateCondition(data: any, condition: TransformationCondition): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue === conditionValue;
      case 'NOT_EQUALS':
        return fieldValue !== conditionValue;
      case 'CONTAINS':
        return String(fieldValue).includes(String(conditionValue));
      case 'STARTS_WITH':
        return String(fieldValue).startsWith(String(conditionValue));
      case 'ENDS_WITH':
        return String(fieldValue).endsWith(String(conditionValue));
      case 'GREATER_THAN':
        return parseFloat(fieldValue) > parseFloat(conditionValue);
      case 'LESS_THAN':
        return parseFloat(fieldValue) < parseFloat(conditionValue);
      case 'IN':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'NOT_IN':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private async validateData(data: any, validations: ValidationRule[], phase: 'input' | 'output'): Promise<{
    errors: Array<{ field: string; message: string; severity: 'ERROR' | 'WARNING'; code: string }>;
    warnings: Array<{ field: string; message: string; code: string }>;
  }> {
    const errors: Array<{ field: string; message: string; severity: 'ERROR' | 'WARNING'; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    for (const validation of validations) {
      const fieldValue = this.getNestedValue(data, validation.field);
      let isValid = true;
      let errorMessage = validation.errorMessage;

      switch (validation.validationType) {
        case 'REQUIRED':
          isValid = fieldValue != null && fieldValue !== '';
          break;

        case 'FORMAT':
          if (fieldValue != null && validation.parameters.pattern) {
            const regex = new RegExp(validation.parameters.pattern);
            isValid = regex.test(String(fieldValue));
          }
          break;

        case 'RANGE':
          if (fieldValue != null) {
            const numValue = parseFloat(fieldValue);
            if (validation.parameters.min != null) {
              isValid = isValid && numValue >= validation.parameters.min;
            }
            if (validation.parameters.max != null) {
              isValid = isValid && numValue <= validation.parameters.max;
            }
          }
          break;

        case 'LENGTH':
          if (fieldValue != null) {
            const length = String(fieldValue).length;
            if (validation.parameters.minLength != null) {
              isValid = isValid && length >= validation.parameters.minLength;
            }
            if (validation.parameters.maxLength != null) {
              isValid = isValid && length <= validation.parameters.maxLength;
            }
          }
          break;

        case 'CUSTOM':
          if (validation.parameters.functionName) {
            const customFunc = this.functionRegistry.get(validation.parameters.functionName);
            if (customFunc) {
              isValid = customFunc(fieldValue, validation.parameters);
            }
          }
          break;
      }

      if (!isValid) {
        if (validation.severity === 'ERROR') {
          errors.push({
            field: validation.field,
            message: errorMessage,
            severity: validation.severity,
            code: validation.id,
          });
        } else {
          warnings.push({
            field: validation.field,
            message: errorMessage,
            code: validation.id,
          });
        }
      }
    }

    return { errors, warnings };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (current[key] == null) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private convertDataType(value: any, dataType: string, format?: string): any {
    if (value == null) return value;

    switch (dataType) {
      case 'STRING':
        return String(value);
      case 'NUMBER':
        return parseFloat(value) || 0;
      case 'BOOLEAN':
        return Boolean(value);
      case 'DATE':
        const date = new Date(value);
        return format ? this.formatDateString(date, format) : date.toISOString().split('T')[0];
      case 'OBJECT':
        return typeof value === 'object' ? value : JSON.parse(String(value));
      case 'ARRAY':
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }

  private formatDateString(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  // Rule Management
  public async addTransformationRule(rule: Omit<TransformationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: TransformationRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transformationRules.set(ruleId, newRule);

    logger.info('Transformation rule added', { ruleId, name: rule.name });
    this.emit('ruleAdded', newRule);

    return ruleId;
  }

  public async updateTransformationRule(ruleId: string, updates: Partial<TransformationRule>): Promise<void> {
    const existingRule = this.transformationRules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Transformation rule not found: ${ruleId}`);
    }

    const updatedRule: TransformationRule = {
      ...existingRule,
      ...updates,
      id: ruleId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.transformationRules.set(ruleId, updatedRule);

    logger.info('Transformation rule updated', { ruleId });
    this.emit('ruleUpdated', updatedRule);
  }

  public async deleteTransformationRule(ruleId: string): Promise<void> {
    const rule = this.transformationRules.get(ruleId);
    if (!rule) {
      throw new Error(`Transformation rule not found: ${ruleId}`);
    }

    this.transformationRules.delete(ruleId);

    logger.info('Transformation rule deleted', { ruleId });
    this.emit('ruleDeleted', ruleId);
  }

  public getTransformationRule(ruleId: string): TransformationRule | undefined {
    return this.transformationRules.get(ruleId);
  }

  public getAllTransformationRules(): TransformationRule[] {
    return Array.from(this.transformationRules.values());
  }

  // Lookup Table Management
  public async addLookupTable(table: Omit<LookupTable, 'id'>): Promise<string> {
    const tableId = `lookup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTable: LookupTable = {
      ...table,
      id: tableId,
    };

    this.lookupTables.set(tableId, newTable);

    logger.info('Lookup table added', { tableId, name: table.name });
    this.emit('lookupTableAdded', newTable);

    return tableId;
  }

  public async updateLookupTable(tableId: string, updates: Partial<LookupTable>): Promise<void> {
    const existingTable = this.lookupTables.get(tableId);
    if (!existingTable) {
      throw new Error(`Lookup table not found: ${tableId}`);
    }

    const updatedTable: LookupTable = {
      ...existingTable,
      ...updates,
      id: tableId, // Ensure ID doesn't change
    };

    this.lookupTables.set(tableId, updatedTable);

    // Clear cache if mappings changed
    if (updates.mappings) {
      this.clearCacheForTable(tableId);
    }

    logger.info('Lookup table updated', { tableId });
    this.emit('lookupTableUpdated', updatedTable);
  }

  // Custom Function Registration
  public registerFunction(name: string, func: Function): void {
    this.functionRegistry.set(name, func);
    logger.info('Custom function registered', { name });
    this.emit('functionRegistered', name);
  }

  public unregisterFunction(name: string): void {
    this.functionRegistry.delete(name);
    logger.info('Custom function unregistered', { name });
    this.emit('functionUnregistered', name);
  }

  // Cache Management
  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Cleanup every minute
  }

  private cleanupCache(): void {
    // Simple cache cleanup - in production, implement TTL-based cleanup
    if (this.cache.size > 1000) {
      this.cache.clear();
      logger.debug('Cache cleared due to size limit');
    }
  }

  private clearCacheForTable(tableId: string): void {
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`lookup_${tableId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  // Placeholder methods for database operations
  private async loadTransformationRules(): Promise<void> {
    // TODO: Load from database
    logger.debug('Loading transformation rules from database...');
  }

  private async loadLookupTables(): Promise<void> {
    // TODO: Load from database
    logger.debug('Loading lookup tables from database...');
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Data Transformation Engine...');
    this.transformationRules.clear();
    this.lookupTables.clear();
    this.functionRegistry.clear();
    this.cache.clear();
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Data Transformation Engine shutdown completed');
  }
}

export default DataTransformationEngine;
