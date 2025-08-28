'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon, 
  FolderIcon, 
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

const documents = [
  {
    id: 1,
    name: 'RBI Circular DBOD.No.123-2024.pdf',
    type: 'PDF',
    size: '2.4 MB',
    category: 'Regulatory',
    uploadDate: '2024-03-20',
    status: 'Processed',
    tags: ['RBI', 'Digital Lending', 'Compliance']
  },
  {
    id: 2,
    name: 'KYC Policy Document.docx',
    type: 'DOCX',
    size: '1.8 MB',
    category: 'Policy',
    uploadDate: '2024-03-18',
    status: 'Under Review',
    tags: ['KYC', 'Customer Verification', 'Policy']
  },
  {
    id: 3,
    name: 'Risk Assessment Report Q1-2024.xlsx',
    type: 'XLSX',
    size: '3.2 MB',
    category: 'Reports',
    uploadDate: '2024-03-15',
    status: 'Approved',
    tags: ['Risk', 'Assessment', 'Q1 2024']
  },
  {
    id: 4,
    name: 'Compliance Checklist Template.pdf',
    type: 'PDF',
    size: '856 KB',
    category: 'Templates',
    uploadDate: '2024-03-12',
    status: 'Active',
    tags: ['Template', 'Checklist', 'Compliance']
  },
]

const categories = ['All', 'Regulatory', 'Policy', 'Reports', 'Templates']

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Processed': return 'bg-green-100 text-green-700'
    case 'Under Review': return 'bg-yellow-100 text-yellow-700'
    case 'Approved': return 'bg-blue-100 text-blue-700'
    case 'Active': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage compliance documents, policies, and regulatory files
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FolderIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CloudArrowUpIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                      <span>{doc.uploadDate}</span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      <span className="text-xs text-gray-500">{doc.category}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}