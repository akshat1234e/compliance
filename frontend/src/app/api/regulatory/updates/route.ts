import { NextRequest, NextResponse } from 'next/server'

// Mock data for regulatory updates
const mockUpdates = [
  {
    id: '1',
    title: 'New Digital Lending Guidelines Released',
    type: 'guideline',
    date: '2024-01-15',
    source: 'RBI',
    priority: 'high',
    summary: 'RBI has released new guidelines for digital lending platforms',
    impact: 'All digital lending platforms must comply by March 2024',
    status: 'new',
    tags: ['digital lending', 'guidelines', 'fintech']
  },
  {
    id: '2',
    title: 'Updated Reporting Requirements for NBFCs',
    type: 'requirement',
    date: '2024-01-12',
    source: 'RBI',
    priority: 'medium',
    summary: 'Changes to quarterly reporting requirements for NBFCs',
    impact: 'NBFCs need to update their reporting processes',
    status: 'active',
    tags: ['nbfc', 'reporting', 'quarterly']
  },
  {
    id: '3',
    title: 'Cybersecurity Framework Enhancement',
    type: 'framework',
    date: '2024-01-08',
    source: 'RBI',
    priority: 'high',
    summary: 'Enhanced cybersecurity framework for banking sector',
    impact: 'Banks must implement additional security measures',
    status: 'active',
    tags: ['cybersecurity', 'banking', 'framework']
  },
  {
    id: '4',
    title: 'Payment System Vision 2025 Update',
    type: 'vision',
    date: '2024-01-05',
    source: 'RBI',
    priority: 'medium',
    summary: 'Updates to the Payment System Vision 2025 document',
    impact: 'Payment service providers should align with new vision',
    status: 'active',
    tags: ['payments', 'vision', '2025']
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Filter updates based on query parameters
    let filteredUpdates = mockUpdates

    if (type) {
      filteredUpdates = filteredUpdates.filter(update => update.type === type)
    }

    if (priority) {
      filteredUpdates = filteredUpdates.filter(update => update.priority === priority)
    }

    if (status) {
      filteredUpdates = filteredUpdates.filter(update => update.status === status)
    }

    // Sort by date (newest first)
    filteredUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Apply limit
    if (limit > 0) {
      filteredUpdates = filteredUpdates.slice(0, limit)
    }

    return NextResponse.json({
      success: true,
      data: filteredUpdates,
      total: filteredUpdates.length
    })
  } catch (error) {
    console.error('Error fetching regulatory updates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regulatory updates' },
      { status: 500 }
    )
  }
}
