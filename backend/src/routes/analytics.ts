import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Get analytics data
router.get('/reports', auth, requirePermission('analytics:read'), asyncHandler(async (req, res) => {
  const reports = [
    {
      id: 'report_001',
      name: 'Compliance Dashboard Report',
      type: 'dashboard',
      generatedAt: '2024-01-15',
      data: {
        complianceScore: 87,
        totalWorkflows: 45,
        completedWorkflows: 38
      }
    }
  ]

  res.json({ success: true, data: reports })
}))

export default router
