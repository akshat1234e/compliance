import { NextRequest, NextResponse } from 'next/server'

// Mock data for documents
const mockDocuments = [
  {
    id: '1',
    name: 'RBI Circular - Digital Payment Security Guidelines',
    type: 'circular',
    category: 'Digital Payments',
    uploadDate: '2024-01-15',
    size: '2.4 MB',
    status: 'active',
    tags: ['RBI', 'Digital Payments', 'Security'],
    description: 'Guidelines for implementing security measures in digital payment systems',
    uploadedBy: 'Compliance Team',
    lastModified: '2024-01-15T10:30:00Z',
    version: '1.0',
    url: '/documents/rbi_digital_payment_security.pdf'
  },
  {
    id: '2',
    name: 'Compliance Checklist - KYC Requirements',
    type: 'checklist',
    category: 'KYC/AML',
    uploadDate: '2024-01-10',
    size: '1.8 MB',
    status: 'active',
    tags: ['KYC', 'AML', 'Compliance'],
    description: 'Comprehensive checklist for KYC compliance requirements',
    uploadedBy: 'Risk Management Team',
    lastModified: '2024-01-10T14:20:00Z',
    version: '2.1',
    url: '/documents/kyc_compliance_checklist.pdf'
  },
  {
    id: '3',
    name: 'Risk Assessment Report - Q4 2023',
    type: 'report',
    category: 'Risk Management',
    uploadDate: '2024-01-05',
    size: '5.2 MB',
    status: 'archived',
    tags: ['Risk', 'Assessment', 'Q4 2023'],
    description: 'Quarterly risk assessment report for Q4 2023',
    uploadedBy: 'Risk Assessment Team',
    lastModified: '2024-01-05T16:45:00Z',
    version: '1.0',
    url: '/documents/risk_assessment_q4_2023.pdf'
  },
  {
    id: '4',
    name: 'Audit Trail Documentation',
    type: 'documentation',
    category: 'Audit',
    uploadDate: '2023-12-28',
    size: '3.1 MB',
    status: 'active',
    tags: ['Audit', 'Trail', 'Documentation'],
    description: 'Complete audit trail documentation for compliance review',
    uploadedBy: 'Audit Team',
    lastModified: '2023-12-28T11:15:00Z',
    version: '1.2',
    url: '/documents/audit_trail_documentation.pdf'
  },
  {
    id: '5',
    name: 'Data Protection Policy',
    type: 'policy',
    category: 'Data Protection',
    uploadDate: '2023-12-20',
    size: '1.5 MB',
    status: 'active',
    tags: ['Data Protection', 'Policy', 'GDPR'],
    description: 'Comprehensive data protection policy and procedures',
    uploadedBy: 'Legal Team',
    lastModified: '2023-12-20T09:30:00Z',
    version: '3.0',
    url: '/documents/data_protection_policy.pdf'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter documents based on query parameters
    let filteredDocuments = mockDocuments

    if (search) {
      filteredDocuments = filteredDocuments.filter(doc =>
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.description.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (type) {
      filteredDocuments = filteredDocuments.filter(doc => doc.type === type)
    }

    if (category) {
      filteredDocuments = filteredDocuments.filter(doc => doc.category === category)
    }

    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === status)
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    // Apply pagination
    const total = filteredDocuments.length
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedDocuments,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // In a real implementation, you would save to database and handle file upload
    const newDocument = {
      id: Date.now().toString(),
      ...body,
      uploadDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString(),
      status: 'active',
      version: '1.0',
      uploadedBy: 'Current User' // In real app, get from auth context
    }

    return NextResponse.json({
      success: true,
      data: newDocument,
      message: 'Document uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
