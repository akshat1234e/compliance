/**
 * Predictive Analytics Routes
 * API endpoints for predictive compliance analytics and ML predictions
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import MLModelService from '../services/MLModelService';

const router = Router();
const analyticsEngine = new AnalyticsEngine();
const mlModelService = new MLModelService();

// Initialize services
analyticsEngine.initialize().catch(error => {
  logger.error('Failed to initialize Analytics Engine', error);
});

mlModelService.initialize().catch(error => {
  logger.error('Failed to initialize ML Model Service', error);
});

/**
 * Get comprehensive predictive insights for an organization
 */
router.get('/insights/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  
  logger.info('Fetching predictive insights', { 
    organizationId, 
    userId: req.user?.id 
  });

  const insights = await analyticsEngine.getPredictiveInsights(organizationId);

  res.json({
    success: true,
    data: insights,
    message: 'Predictive insights retrieved successfully',
    timestamp: new Date().toISOString()
  });
}));

/**
 * Get compliance risk predictions
 */
router.get('/risks/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { timeHorizon = 30 } = req.query;
  
  logger.info('Fetching compliance risk predictions', { 
    organizationId, 
    timeHorizon,
    userId: req.user?.id 
  });

  const riskPredictions = await analyticsEngine.predictComplianceRisks(organizationId);

  // Filter by time horizon if specified
  const filteredPredictions = riskPredictions.filter(
    prediction => prediction.timeHorizon <= Number(timeHorizon)
  );

  res.json({
    success: true,
    data: {
      predictions: filteredPredictions,
      totalRisks: filteredPredictions.length,
      highRiskCount: filteredPredictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
      averageConfidence: filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / filteredPredictions.length
    },
    message: 'Compliance risk predictions retrieved successfully'
  });
}));

/**
 * Get regulatory change predictions
 */
router.get('/regulatory-changes/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { minProbability = 0.5 } = req.query;
  
  logger.info('Fetching regulatory change predictions', { 
    organizationId, 
    minProbability,
    userId: req.user?.id 
  });

  const changePredictions = await analyticsEngine.predictRegulatoryChanges(organizationId);

  // Filter by minimum probability
  const filteredPredictions = changePredictions.filter(
    prediction => prediction.probability >= Number(minProbability)
  );

  res.json({
    success: true,
    data: {
      predictions: filteredPredictions,
      totalChanges: filteredPredictions.length,
      highImpactCount: filteredPredictions.filter(p => p.impactScore >= 70).length,
      averageProbability: filteredPredictions.reduce((sum, p) => sum + p.probability, 0) / filteredPredictions.length
    },
    message: 'Regulatory change predictions retrieved successfully'
  });
}));

/**
 * Get anomaly detection results
 */
router.get('/anomalies/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { severity } = req.query;
  
  logger.info('Fetching anomaly detection results', { 
    organizationId, 
    severity,
    userId: req.user?.id 
  });

  const insights = await analyticsEngine.getPredictiveInsights(organizationId);
  let anomalies = insights.anomalies;

  // Filter by severity if specified
  if (severity) {
    anomalies = anomalies.filter(anomaly => anomaly.severity === severity);
  }

  res.json({
    success: true,
    data: {
      anomalies,
      totalAnomalies: anomalies.length,
      severityBreakdown: {
        low: anomalies.filter(a => a.severity === 'low').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        high: anomalies.filter(a => a.severity === 'high').length
      }
    },
    message: 'Anomaly detection results retrieved successfully'
  });
}));

/**
 * Get proactive recommendations
 */
router.get('/recommendations/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { priority, category } = req.query;
  
  logger.info('Fetching proactive recommendations', { 
    organizationId, 
    priority,
    category,
    userId: req.user?.id 
  });

  const insights = await analyticsEngine.getPredictiveInsights(organizationId);
  let recommendations = insights.recommendations;

  // Filter by priority if specified
  if (priority) {
    recommendations = recommendations.filter(rec => rec.priority === priority);
  }

  // Filter by category if specified
  if (category) {
    recommendations = recommendations.filter(rec => rec.category === category);
  }

  res.json({
    success: true,
    data: {
      recommendations,
      totalRecommendations: recommendations.length,
      priorityBreakdown: {
        urgent: recommendations.filter(r => r.priority === 'urgent').length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      }
    },
    message: 'Proactive recommendations retrieved successfully'
  });
}));

/**
 * Make a custom prediction using ML models
 */
router.post('/predict', asyncHandler(async (req: Request, res: Response) => {
  const { modelId, features, organizationId } = req.body;
  
  if (!modelId || !features || !organizationId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: modelId, features, organizationId'
    });
  }

  logger.info('Making custom prediction', { 
    modelId, 
    organizationId,
    userId: req.user?.id 
  });

  const prediction = await mlModelService.predict({
    modelId,
    features,
    organizationId,
    requestId: `api_${Date.now()}`
  });

  res.json({
    success: true,
    data: prediction,
    message: 'Prediction completed successfully'
  });
}));

/**
 * Get ML model information
 */
router.get('/models', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Fetching ML model information', { userId: req.user?.id });

  const models = mlModelService.getAllModels();
  const modelPerformance = await analyticsEngine.getModelPerformance();

  res.json({
    success: true,
    data: {
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        type: model.type,
        algorithm: model.algorithm,
        version: model.version,
        accuracy: model.accuracy,
        status: model.status,
        lastTrained: model.lastTrained,
        features: model.features
      })),
      performance: modelPerformance,
      totalModels: models.length,
      readyModels: models.filter(m => m.status === 'ready').length
    },
    message: 'ML model information retrieved successfully'
  });
}));

/**
 * Get specific model details
 */
router.get('/models/:modelId', asyncHandler(async (req: Request, res: Response) => {
  const { modelId } = req.params;
  
  logger.info('Fetching model details', { modelId, userId: req.user?.id });

  const model = mlModelService.getModel(modelId);
  
  if (!model) {
    return res.status(404).json({
      success: false,
      message: `Model not found: ${modelId}`
    });
  }

  const performance = mlModelService.getModelPerformance(modelId);

  res.json({
    success: true,
    data: {
      model,
      performance
    },
    message: 'Model details retrieved successfully'
  });
}));

/**
 * Export predictions in various formats
 */
router.get('/export/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { format = 'json' } = req.query;
  
  if (!['json', 'csv', 'pdf'].includes(format as string)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid format. Supported formats: json, csv, pdf'
    });
  }

  logger.info('Exporting predictions', { 
    organizationId, 
    format,
    userId: req.user?.id 
  });

  const exportData = await analyticsEngine.exportPredictions(
    organizationId, 
    format as 'json' | 'csv' | 'pdf'
  );

  // Set appropriate content type
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    pdf: 'application/pdf'
  };

  res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
  res.setHeader('Content-Disposition', `attachment; filename="predictions_${organizationId}_${Date.now()}.${format}"`);
  
  res.send(exportData);
}));

/**
 * Get analytics dashboard data
 */
router.get('/dashboard/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  
  logger.info('Fetching analytics dashboard data', { 
    organizationId,
    userId: req.user?.id 
  });

  const insights = await analyticsEngine.getPredictiveInsights(organizationId);
  const models = mlModelService.getAllModels();

  // Prepare dashboard summary
  const dashboardData = {
    overview: {
      complianceScore: insights.complianceMetrics.currentScore,
      predictedScore: insights.complianceMetrics.predictedScore,
      trendDirection: insights.complianceMetrics.trendDirection,
      totalRisks: insights.complianceRiskPredictions.length,
      highRisks: insights.complianceRiskPredictions.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
      totalAnomalies: insights.anomalies.length,
      urgentRecommendations: insights.recommendations.filter(r => r.priority === 'urgent').length
    },
    riskDistribution: {
      low: insights.complianceRiskPredictions.filter(r => r.riskLevel === 'low').length,
      medium: insights.complianceRiskPredictions.filter(r => r.riskLevel === 'medium').length,
      high: insights.complianceRiskPredictions.filter(r => r.riskLevel === 'high').length,
      critical: insights.complianceRiskPredictions.filter(r => r.riskLevel === 'critical').length
    },
    upcomingChanges: insights.regulatoryChangePredictions
      .filter(c => c.probability > 0.7)
      .sort((a, b) => a.expectedDate.getTime() - b.expectedDate.getTime())
      .slice(0, 5),
    modelStatus: {
      total: models.length,
      ready: models.filter(m => m.status === 'ready').length,
      training: models.filter(m => m.status === 'training').length,
      error: models.filter(m => m.status === 'error').length
    },
    recentAnomalies: insights.anomalies
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 10),
    topRecommendations: insights.recommendations
      .filter(r => r.priority === 'urgent' || r.priority === 'high')
      .slice(0, 5)
  };

  res.json({
    success: true,
    data: dashboardData,
    message: 'Analytics dashboard data retrieved successfully',
    timestamp: new Date().toISOString()
  });
}));

export default router;
