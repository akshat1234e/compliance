import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Get integrations
router.get('/', auth, requirePermission('integrations:read'), asyncHandler(async (req, res) => {
  const integrations = [
    {
      id: 'int_001',
      name: 'RBI API Integration',
      type: 'api',
      status: 'active',
      lastSync: '2024-01-15T10:30:00Z'
    }
  ]

  res.json({ success: true, data: integrations })
}))

export default router
