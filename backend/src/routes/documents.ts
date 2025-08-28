import express from 'express'
import multer from 'multer'
import path from 'path'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|csv/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX, and CSV files are allowed'))
    }
  }
})

// Get all documents
router.get('/', auth, requirePermission('documents:read'), asyncHandler(async (req, res) => {
  const documents = [
    {
      id: 'doc_001',
      name: 'AML Policy 2024',
      type: 'policy',
      category: 'AML',
      size: '2.5MB',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: '2024-01-15',
      status: 'approved',
      version: '1.0'
    }
  ]

  res.json({ success: true, data: documents })
}))

// Upload document
router.post('/upload', auth, requirePermission('documents:write'), upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }

  const document = {
    id: `doc_${Date.now()}`,
    name: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    uploadedBy: req.user!.userId,
    uploadedAt: new Date(),
    status: 'pending'
  }

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: document
  })
}))

export default router
