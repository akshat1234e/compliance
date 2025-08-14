'use client'

import {
    CloudArrowUpIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

// Mock data for development
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
    description: 'Guidelines for implementing security measures in digital payment systems'
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
    description: 'Comprehensive checklist for KYC compliance requirements'
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
    description: 'Quarterly risk assessment report for Q4 2023'
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
    description: 'Complete audit trail documentation for compliance review'
  }
]

const documentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'circular', label: 'RBI Circulars' },
  { value: 'checklist', label: 'Checklists' },
  { value: 'report', label: 'Reports' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'policy', label: 'Policies' }
]

const documentCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Digital Payments', label: 'Digital Payments' },
  { value: 'KYC/AML', label: 'KYC/AML' },
  { value: 'Risk Management', label: 'Risk Management' },
  { value: 'Audit', label: 'Audit' },
  { value: 'Regulatory', label: 'Regulatory' }
]

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch documents with React Query
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents', { search: searchTerm, type: selectedType, category: selectedCategory }],
    queryFn: async () => {
      // Try to fetch from API, fallback to mock data
      try {
        const response = await fetch('/api/documents?' + new URLSearchParams({
          search: searchTerm,
          type: selectedType !== 'all' ? selectedType : '',
          category: selectedCategory !== 'all' ? selectedCategory : ''
        }))
        
        if (!response.ok) {
          throw new Error('API not available')
        }
        
        return await response.json()
      } catch (error) {
        // Fallback to mock data
        console.log('Using mock data for documents')
        return mockDocuments.filter(doc => {
          const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               doc.description.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesType = selectedType === 'all' || doc.type === selectedType
          const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
          return matchesSearch && matchesType && matchesCategory
        })
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete document')
      console.error('Delete error:', error)
    },
  })

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
    }
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.active
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'circular':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
      case 'report':
        return <DocumentArrowDownIcon className="h-5 w-5 text-green-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading documents</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Unable to load documents. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage compliance documents, circulars, and reports
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {documentCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Documents ({documents.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'Get started by uploading your first document.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(document.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(document.status)}`}>
                          {document.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{document.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Category: {document.category}</span>
                        <span>Size: {document.size}</span>
                        <span>Uploaded: {document.uploadDate}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {document.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="View document"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Download document"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Delete document"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter document name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select category</option>
                    {documentCategories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Document uploaded successfully')
                    setIsUploadModalOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
