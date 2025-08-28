import { NextRequest, NextResponse } from 'next/server'

// Mock data for risk assessments
const mockRiskAssessments = [
  {
    id: '1',
    title: 'Digital Payment Security Risk Assessment',
    category: 'Operational Risk',
    riskLevel: 'High',
    score: 8.5,
    status: 'active',
    lastUpdated: '2024-01-15',
    nextReview: '2024-04-15',
    owner: 'Risk Management Team',
    description: 'Assessment of security risks in digital payment systems',
    mitigationActions: 3,
    completedActions: 1,
    createdDate: '2024-01-01',
    reviewFrequency: 'quarterly',
    impact: 'High',
    likelihood: 'Medium',
    riskFactors: [
      'Cybersecurity threats',
      'System vulnerabilities',
      'Third-party integrations'
    ],
    mitigationStrategies: [
      'Enhanced security protocols',
      'Regular security audits',
      'Staff training programs'
    ]
  },
  {
    id: '2',
    title: 'KYC Compliance Risk Evaluation',
    category: 'Compliance Risk',
    riskLevel: 'Medium',
    score: 6.2,
    status: 'under_review',
    lastUpdated: '2024-01-10',
    nextReview: '2024-03-10',
    owner: 'Compliance Team',
    description: 'Evaluation of risks related to KYC compliance processes',
    mitigationActions: 5,
    completedActions: 3,
    createdDate: '2023-12-15',
    reviewFrequency: 'monthly',
    impact: 'Medium',
    likelihood: 'High',
    riskFactors: [
      'Regulatory changes',
      'Documentation gaps',
      'Process inefficiencies'
    ],
    mitigationStrategies: [
      'Process automation',
      'Regular training',
      'Documentation updates'
    ]
  },
  {
    id: '3',
    title: 'Credit Risk Assessment - Q4 2023',
    category: 'Credit Risk',
    riskLevel: 'Low',
    score: 3.8,
    status: 'completed',
    lastUpdated: '2023-12-28',
    nextReview: '2024-06-28',
    owner: 'Credit Risk Team',
    description: 'Quarterly credit risk assessment for Q4 2023',
    mitigationActions: 2,
    completedActions: 2,
    createdDate: '2023-12-01',
    reviewFrequency: 'quarterly',
    impact: 'Low',
    likelihood: 'Low',
    riskFactors: [
      'Economic conditions',
      'Portfolio concentration',
      'Default rates'
    ],
    mitigationStrategies: [
      'Diversification',
      'Enhanced monitoring',
      'Stress testing'
    ]
  },
  {
    id: '4',
    title: 'Market Risk Analysis',
    category: 'Market Risk',
    riskLevel: 'High',
    score: 7.9,
    status: 'active',
    lastUpdated: '2024-01-08',
    nextReview: '2024-02-08',
    owner: 'Market Risk Team',
    description: 'Analysis of market risks affecting portfolio performance',
    mitigationActions: 4,
    completedActions: 1,
    createdDate: '2024-01-01',
    reviewFrequency: 'monthly',
    impact: 'High',
    likelihood: 'Medium',
    riskFactors: [
      'Interest rate volatility',
      'Currency fluctuations',
      'Market liquidity'
    ],
    mitigationStrategies: [
      'Hedging strategies',
      'Portfolio rebalancing',
      'Risk limits'
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const riskLevel = searchParams.get('riskLevel') || ''
    const status = searchParams.get('status') || ''
    const owner = searchParams.get('owner') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter assessments based on query parameters
    let filteredAssessments = mockRiskAssessments

    if (category) {
      filteredAssessments = filteredAssessments.filter(assessment =>
        assessment.category === category
      )
    }

    if (riskLevel) {
      filteredAssessments = filteredAssessments.filter(assessment =>
        assessment.riskLevel === riskLevel
      )
    }

    if (status) {
      filteredAssessments = filteredAssessments.filter(assessment =>
        assessment.status === status
      )
    }

    if (owner) {
      filteredAssessments = filteredAssessments.filter(assessment =>
        assessment.owner.toLowerCase().includes(owner.toLowerCase())
      )
    }

    // Sort by last updated (newest first)
    filteredAssessments.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )

    // Apply pagination
    const total = filteredAssessments.length
    const paginatedAssessments = filteredAssessments.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedAssessments,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching risk assessments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch risk assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // In a real implementation, you would save to database
    const newAssessment = {
      id: Date.now().toString(),
      ...body,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'draft',
      mitigationActions: 0,
      completedActions: 0,
      score: 0 // Would be calculated based on assessment criteria
    }

    return NextResponse.json({
      success: true,
      data: newAssessment,
      message: 'Risk assessment created successfully'
    })
  } catch (error) {
    console.error('Error creating risk assessment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create risk assessment' },
      { status: 500 }
    )
  }
}
