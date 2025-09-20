'use client'

import { useState, useRef } from 'react'
import { 
  DocumentTextIcon, 
  FolderIcon, 
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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

// Status styling constants
const STATUS_STYLES = {
  'Processed': 'bg-green-100 text-green-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-blue-100 text-blue-700',
  'Active': 'bg-purple-100 text-purple-700',
  'default': 'bg-gray-100 text-gray-700'
} as const

// File type styling constants
const FILE_TYPE_STYLES = {
  PDF: { bg: 'bg-red-100', text: 'text-red-600' },
  DOC: { bg: 'bg-blue-100', text: 'text-blue-600' },
  XLS: { bg: 'bg-green-100', text: 'text-green-600' },
  IMG: { bg: 'bg-purple-100', text: 'text-purple-600' }
} as const

const getStatusColor = (status: string) => {
  return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.default
}

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState(documents)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRefs = useRef<{[key: string]: NodeJS.Timeout}>({})

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [uploadErrors, setUploadErrors] = useState<string[]>([])

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'png', 'jpg', 'jpeg']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return `File type .${fileExtension} not allowed. Allowed: ${allowedTypes.join(', ')}`
    }
    
    if (file.size > maxSize) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit`
    }
    
    return null
  }

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    setUploadErrors([])
    const errors: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)
      
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
        continue
      }
      
      const fileId = `${file.name}-${Date.now()}`
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
      
      // Simulate upload progress with cleanup
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0
          if (currentProgress >= 100) {
            clearInterval(progressInterval)
            delete intervalRefs.current[fileId]
            return prev
          }
          return { ...prev, [fileId]: currentProgress + 10 }
        })
      }, 200)
      
      intervalRefs.current[fileId] = progressInterval
      
      const newDoc = {
        id: uploadedDocuments.length + i + 1,
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: file.size > 1024 * 1024 
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`,
        category: file.name.toLowerCase().includes('rbi') ? 'Regulatory' : 'Policy',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'Processing',
        tags: ['Uploaded', 'New', file.type.includes('pdf') ? 'PDF' : 'Document']
      }
      
      setTimeout(() => {
        setUploadedDocuments(prev => [...prev, { ...newDoc, status: 'Processed' }])
        setUploadProgress(prev => {
          const { [fileId]: removed, ...rest } = prev
          return rest
        })
        if (intervalRefs.current[fileId]) {
          clearInterval(intervalRefs.current[fileId])
          delete intervalRefs.current[fileId]
        }
      }, 2500)
    }
    
    if (errors.length > 0) {
      setUploadErrors(errors)
    }
    
    setIsUploading(false)
  }

  const handleDeleteDocument = (docId: number) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const handleViewDocument = (doc: any) => {
    // Simulate document preview
    alert(`Viewing: ${doc.name}\nType: ${doc.type}\nSize: ${doc.size}`)
  }

  const handleDownloadDocument = (doc: any) => {
    // Simulate document download
    const link = document.createElement('a')
    link.href = '#'
    link.download = doc.name
    link.click()
  }

  const filteredDocuments = uploadedDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse (PDF, DOC, XLSX, Images - Max 10MB)
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Choose Files
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept=".pdf,.doc,.docx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage compliance documents, policies, and regulatory files
          </p>
        </div>
        <div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>

        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Uploading Files...</h3>
          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([fileId, progress]) => {
              const fileName = fileId.split('-')[0]
              return (
                <div key={fileId} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{fileName}</span>
                      <span className="text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {progress === 100 && (
                    <div className="text-green-500">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
          <button 
            onClick={() => setUploadErrors([])}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{uploadedDocuments.length}</p>
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
                    {(() => {
                      const getFileTypeDisplay = (type: string) => {
                        if (type === 'PDF') return { style: FILE_TYPE_STYLES.PDF, label: 'PDF' }
                        if (['DOCX', 'DOC'].includes(type)) return { style: FILE_TYPE_STYLES.DOC, label: 'DOC' }
                        if (['XLSX', 'XLS'].includes(type)) return { style: FILE_TYPE_STYLES.XLS, label: 'XLS' }
                        if (['PNG', 'JPG', 'JPEG'].includes(type)) return { style: FILE_TYPE_STYLES.IMG, label: 'IMG' }
                        return null
                      }
                      
                      const fileDisplay = getFileTypeDisplay(doc.type)
                      return fileDisplay ? (
                        <div className={`h-10 w-10 ${fileDisplay.style.bg} rounded-lg flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${fileDisplay.style.text}`}>{fileDisplay.label}</span>
                        </div>
                      ) : (
                        <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                      )
                    })()}
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
                      <span className={`px-2 py-1 text-xs font-medium rounded flex items-center space-x-1 ${getStatusColor(doc.status)}`}>
                        {doc.status === 'Processing' && (
                          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                        )}
                        {doc.status === 'Processed' && (
                          <CheckCircleIcon className="h-3 w-3" />
                        )}
                        <span>{doc.status}</span>
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
                  <button 
                    onClick={() => handleViewDocument(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Document"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download Document"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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