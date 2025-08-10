/**
 * Risk Assessment Types and Interfaces
 * Defines all types related to risk assessment and prediction
 */

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EntityType {
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  PROCESS = 'process',
  SYSTEM = 'system',
  PRODUCT = 'product',
  PROJECT = 'project',
}

export enum RiskCategory {
  REGULATORY = 'regulatory',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  REPUTATIONAL = 'reputational',
  STRATEGIC = 'strategic',
  TECHNOLOGY = 'technology',
}

export interface RiskScore {
  value: number; // 0-1 scale
  confidence: number; // 0-1 scale
  factors: Array<{
    name: string;
    weight: number;
    score: number;
  }>;
  lastUpdated: Date;
}

export interface RiskAssessment {
  id: string;
  entityId: string;
  entityType: EntityType;
  organizationId: string;
  
  // Scores
  compositeScore: number;
  riskLevel: RiskLevel;
  scores: {
    regulatory: RiskScore;
    operational: RiskScore;
    financial: RiskScore;
    reputational: RiskScore;
  };
  
  // Metadata
  assessmentDate: Date;
  assessedBy: string;
  methodology: string;
  confidence: number;
  
  // Analysis
  riskFactors: string[];
  recommendations: string[];
  
  // Timing
  processingTime: number;
  
  // Context
  parameters: Record<string, any>;
  metadata: Record<string, any>;
}

export interface RiskFactor {
  id: string;
  name: string;
  category: RiskCategory;
  weight: number;
  description: string;
  isActive: boolean;
  
  // Configuration
  calculationMethod?: string;
  dataSource?: string;
  updateFrequency?: number;
  
  // Validation
  minValue?: number;
  maxValue?: number;
  validationRules?: string[];
}

export interface RiskMetrics {
  averageRiskScore: number;
  riskDistribution: Record<RiskLevel, number>;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
  
  // Additional metrics
  totalAssessments?: number;
  highRiskEntities?: number;
  improvementRate?: number;
  complianceRate?: number;
}

export interface RiskPrediction {
  id: string;
  entityId: string;
  predictionDate: Date;
  horizon: number; // days
  
  // Predictions
  predictions: Array<{
    date: string;
    riskScore: number;
    confidence: number;
    factors: string[];
  }>;
  
  // Analysis
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  methodology: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  modelVersion: string;
}

export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  entityId: string;
  
  // Scenario configuration
  parameters: Record<string, any>;
  stressFactors: Array<{
    factor: string;
    severity: number;
    probability: number;
  }>;
  
  // Results
  results: {
    baseCase: ScenarioResult;
    stressCase: ScenarioResult;
    worstCase: ScenarioResult;
  };
  
  // Analysis
  recommendations: string[];
  mitigationStrategies: string[];
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  organizationId: string;
}

export interface ScenarioResult {
  riskScore: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  expectedLoss?: number;
  timeToImpact?: number;
  affectedAreas: string[];
}

export interface RiskModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'neural_network' | 'ensemble';
  version: string;
  
  // Model details
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Training
  trainingDate: Date;
  trainingDataSize: number;
  features: string[];
  
  // Status
  isActive: boolean;
  isProduction: boolean;
  
  // Metadata
  createdBy: string;
  description: string;
  modelPath: string;
}

export interface AssessmentRequest {
  entityId: string;
  entityType: EntityType;
  organizationId: string;
  userId: string;
  
  // Configuration
  includeHistorical?: boolean;
  includePredictions?: boolean;
  customFactors?: string[];
  
  // Parameters
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PredictionRequest {
  entityId: string;
  horizon: number; // days
  includeFactors?: boolean;
  modelVersion?: string;
  
  // Configuration
  confidenceThreshold?: number;
  includeScenarios?: boolean;
}

// Request/Response Types
export interface CreateAssessmentRequest {
  entityId: string;
  entityType: EntityType;
  includeHistorical?: boolean;
  includePredictions?: boolean;
  customFactors?: string[];
  parameters?: Record<string, any>;
}

export interface AssessmentResponse {
  id: string;
  entityId: string;
  entityType: EntityType;
  compositeScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  assessmentDate: Date;
  processingTime: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface RiskMetricsResponse {
  averageRiskScore: number;
  riskDistribution: Record<RiskLevel, number>;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  totalAssessments: number;
  highRiskEntities: number;
  lastUpdated: Date;
}

export interface PredictionResponse {
  id: string;
  entityId: string;
  horizon: number;
  predictions: Array<{
    date: string;
    riskScore: number;
    confidence: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  createdAt: Date;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  entityId: string;
  results: {
    baseCase: ScenarioResult;
    stressCase: ScenarioResult;
    worstCase: ScenarioResult;
  };
  recommendations: string[];
  createdAt: Date;
}

export interface ModelResponse {
  id: string;
  name: string;
  type: string;
  version: string;
  accuracy: number;
  isActive: boolean;
  trainingDate: Date;
  features: string[];
}
