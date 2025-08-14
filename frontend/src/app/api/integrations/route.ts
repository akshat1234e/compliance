import { NextRequest, NextResponse } from 'next/server'

// Mock data for integrations
const mockIntegrations = [
  {
    id: '1',
    name: 'Core Banking System',
    type: 'banking',
    provider: 'Temenos T24',
    status: 'connected',
    lastSync: '2024-01-15T10:30:00Z',
    description: 'Integration with core banking system for transaction monitoring',
    endpoint: 'https://api.temenos.com/v1',
    authType: 'oauth2',
    dataTypes: ['transactions', 'accounts', 'customers'],
    syncFrequency: 'real-time',
    healthScore: 98
  },
  {
    id: '2',
    name: 'Risk Management Platform',
    type: 'risk',
    provider: 'SAS Risk Management',
    status: 'connected',
    lastSync: '2024-01-15T09:45:00Z',
    description: 'Integration for risk assessment and monitoring',
    endpoint: 'https://api.sas.com/risk/v2',
    authType: 'api_key',
    dataTypes: ['risk_scores', 'assessments', 'alerts'],
    syncFrequency: 'hourly',
    healthScore: 95
  },
  {
    id: '3',
    name: 'Document Management System',
    type: 'document',
    provider: 'SharePoint Online',
    status: 'error',
    lastSync: '2024-01-14T16:20:00Z',
    description: 'Document storage and compliance documentation',
    endpoint: 'https://graph.microsoft.com/v1.0',
    authType: 'oauth2',
    dataTypes: ['documents', 'metadata', 'versions'],
    syncFrequency: 'daily',
    healthScore: 45,
    error: 'Authentication token expired'
  },
  {
    id: '4',
    name: 'Regulatory Data Feed',
    type: 'regulatory',
    provider: 'Thomson Reuters',
    status: 'pending',
    lastSync: null,
    description: 'Real-time regulatory updates and circulars',
    endpoint: 'https://api.thomsonreuters.com/regulatory/v1',
    authType: 'api_key',
    dataTypes: ['circulars', 'updates', 'notifications'],
    syncFrequency: 'real-time',
    healthScore: null
  },
  {
    id: '5',
    name: 'Audit Trail System',
    type: 'audit',
    provider: 'IBM OpenPages',
    status: 'connected',
    lastSync: '2024-01-15T08:15:00Z',
    description: 'Audit trail and compliance monitoring',
    endpoint: 'https://api.ibm.com/openpages/v1',
    authType: 'oauth2',
    dataTypes: ['audit_logs', 'compliance_data', 'reports'],
    syncFrequency: 'daily',
    healthScore: 92
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const provider = searchParams.get('provider') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter integrations based on query parameters
    let filteredIntegrations = mockIntegrations

    if (type) {
      filteredIntegrations = filteredIntegrations.filter(integration =>
        integration.type === type
      )
    }

    if (status) {
      filteredIntegrations = filteredIntegrations.filter(integration =>
        integration.status === status
      )
    }

    if (provider) {
      filteredIntegrations = filteredIntegrations.filter(integration =>
        integration.provider.toLowerCase().includes(provider.toLowerCase())
      )
    }

    // Sort by last sync (most recent first, null values last)
    filteredIntegrations.sort((a, b) => {
      if (!a.lastSync && !b.lastSync) return 0
      if (!a.lastSync) return 1
      if (!b.lastSync) return -1
      return new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime()
    })

    // Apply pagination
    const total = filteredIntegrations.length
    const paginatedIntegrations = filteredIntegrations.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedIntegrations,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // In a real implementation, you would save to database
    const newIntegration = {
      id: Date.now().toString(),
      ...body,
      status: 'pending',
      lastSync: null,
      healthScore: null,
      createdDate: new Date().toISOString().split('T')[0]
    }

    return NextResponse.json({
      success: true,
      data: newIntegration,
      message: 'Integration created successfully'
    })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}
