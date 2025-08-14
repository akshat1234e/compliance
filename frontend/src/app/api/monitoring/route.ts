import { NextRequest, NextResponse } from 'next/server'

// Mock data for monitoring
const mockMonitoringData = {
  systemStatus: {
    overall: 'healthy',
    uptime: '99.97%',
    lastIncident: '2024-01-10T14:30:00Z',
    activeAlerts: 2,
    resolvedToday: 8
  },
  services: [
    {
      id: '1',
      name: 'Authentication Service',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: 45,
      lastCheck: new Date().toISOString(),
      endpoint: '/api/auth/health'
    },
    {
      id: '2',
      name: 'Compliance Engine',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: 120,
      lastCheck: new Date().toISOString(),
      endpoint: '/api/compliance/health'
    },
    {
      id: '3',
      name: 'Risk Assessment Service',
      status: 'warning',
      uptime: '99.85%',
      responseTime: 250,
      lastCheck: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      endpoint: '/api/risk/health',
      issue: 'High response time detected'
    },
    {
      id: '4',
      name: 'Document Management',
      status: 'healthy',
      uptime: '99.92%',
      responseTime: 80,
      lastCheck: new Date().toISOString(),
      endpoint: '/api/documents/health'
    },
    {
      id: '5',
      name: 'Regulatory Intelligence',
      status: 'error',
      uptime: '98.50%',
      responseTime: 0,
      lastCheck: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      endpoint: '/api/regulatory/health',
      issue: 'Service unavailable - connection timeout'
    }
  ],
  alerts: [
    {
      id: '1',
      type: 'error',
      title: 'Regulatory Intelligence Service Down',
      description: 'Service has been unavailable for 5 minutes',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'high',
      status: 'active'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Risk Assessment High Response Time',
      description: 'Response time exceeded threshold (200ms)',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      severity: 'medium',
      status: 'active'
    },
    {
      id: '3',
      type: 'info',
      title: 'Scheduled Maintenance Completed',
      description: 'Database maintenance completed successfully',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: 'low',
      status: 'resolved'
    }
  ],
  metrics: {
    totalRequests: 45678 + Math.floor(Math.random() * 1000),
    successRate: 99.2,
    averageResponseTime: 125 + Math.floor(Math.random() * 50),
    errorRate: 0.8,
    activeUsers: 234 + Math.floor(Math.random() * 50),
    peakConcurrentUsers: 456
  },
  recentActivity: [
    {
      id: '1',
      type: 'compliance_check',
      message: 'KYC compliance check completed for customer ID: 12345',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      status: 'success'
    },
    {
      id: '2',
      type: 'risk_assessment',
      message: 'High-risk transaction flagged for review',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      status: 'warning'
    },
    {
      id: '3',
      type: 'document_upload',
      message: 'New regulatory document uploaded: RBI Circular 2024-01',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      status: 'info'
    },
    {
      id: '4',
      type: 'user_login',
      message: 'User admin@compliance.com logged in',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      status: 'info'
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const serviceId = searchParams.get('serviceId') || ''

    // Simulate real-time data updates
    let monitoringData = { ...mockMonitoringData }

    // Update timestamps to be more realistic
    monitoringData.services = monitoringData.services.map(service => ({
      ...service,
      lastCheck: service.status === 'error'
        ? new Date(Date.now() - 300000).toISOString() // 5 minutes ago for error services
        : new Date(Date.now() - Math.random() * 60000).toISOString() // Random within last minute
    }))

    // Filter by service if specified
    if (serviceId) {
      monitoringData.services = monitoringData.services.filter(service =>
        service.id === serviceId
      )
    }

    // Simulate different data based on time range
    if (timeRange === '1h') {
      monitoringData.metrics.totalRequests = Math.floor(monitoringData.metrics.totalRequests / 24)
      monitoringData.recentActivity = monitoringData.recentActivity.slice(0, 10)
    } else if (timeRange === '24h') {
      monitoringData.metrics.totalRequests = Math.floor(monitoringData.metrics.totalRequests / 7)
      monitoringData.recentActivity = monitoringData.recentActivity.slice(0, 50)
    }

    return NextResponse.json({
      success: true,
      data: monitoringData,
      timestamp: new Date().toISOString(),
      timeRange,
      serviceId: serviceId || 'all'
    })
  } catch (error) {
    console.error('Error fetching monitoring data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}
