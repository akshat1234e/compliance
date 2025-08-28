import { NextRequest, NextResponse } from 'next/server'

// Mock data for development
const mockCirculars = [
  {
    id: '1',
    title: 'Guidelines on Digital Payment Security',
    number: 'RBI/2024-25/01',
    date: '2024-01-15',
    category: 'Digital Payments',
    status: 'active',
    priority: 'high',
    summary: 'New guidelines for implementing security measures in digital payment systems',
    content: 'Detailed guidelines for banks and financial institutions...',
    applicableFrom: '2024-02-01',
    complianceDeadline: '2024-03-31',
    tags: ['digital payments', 'security', 'guidelines'],
    attachments: [
      { name: 'circular_2024_01.pdf', size: '2.4 MB', url: '/documents/circular_2024_01.pdf' }
    ]
  },
  {
    id: '2',
    title: 'Updated KYC Norms for Banks',
    number: 'RBI/2024-25/02',
    date: '2024-01-10',
    category: 'KYC/AML',
    status: 'active',
    priority: 'medium',
    summary: 'Revised Know Your Customer norms and procedures',
    content: 'Updated KYC requirements and procedures...',
    applicableFrom: '2024-01-15',
    complianceDeadline: '2024-04-15',
    tags: ['kyc', 'aml', 'customer verification'],
    attachments: [
      { name: 'kyc_norms_2024.pdf', size: '1.8 MB', url: '/documents/kyc_norms_2024.pdf' }
    ]
  },
  {
    id: '3',
    title: 'Risk Management Framework Updates',
    number: 'RBI/2024-25/03',
    date: '2024-01-05',
    category: 'Risk Management',
    status: 'active',
    priority: 'high',
    summary: 'Updates to the risk management framework for banks',
    content: 'Comprehensive updates to risk management practices...',
    applicableFrom: '2024-01-10',
    complianceDeadline: '2024-06-30',
    tags: ['risk management', 'framework', 'compliance'],
    attachments: [
      { name: 'risk_framework_2024.pdf', size: '3.2 MB', url: '/documents/risk_framework_2024.pdf' }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''

    // Filter circulars based on query parameters
    let filteredCirculars = mockCirculars

    if (search) {
      filteredCirculars = filteredCirculars.filter(circular =>
        circular.title.toLowerCase().includes(search.toLowerCase()) ||
        circular.summary.toLowerCase().includes(search.toLowerCase()) ||
        circular.number.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category) {
      filteredCirculars = filteredCirculars.filter(circular =>
        circular.category === category
      )
    }

    if (status) {
      filteredCirculars = filteredCirculars.filter(circular =>
        circular.status === status
      )
    }

    if (priority) {
      filteredCirculars = filteredCirculars.filter(circular =>
        circular.priority === priority
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredCirculars,
      total: filteredCirculars.length
    })
  } catch (error) {
    console.error('Error fetching circulars:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulars' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // In a real implementation, you would save to database
    const newCircular = {
      id: Date.now().toString(),
      ...body,
      date: new Date().toISOString().split('T')[0],
      status: 'draft'
    }

    return NextResponse.json({
      success: true,
      data: newCircular,
      message: 'Circular created successfully'
    })
  } catch (error) {
    console.error('Error creating circular:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create circular' },
      { status: 500 }
    )
  }
}
