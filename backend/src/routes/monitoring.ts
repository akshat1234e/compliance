import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Get monitoring data
router.get('/status', auth, requirePermission('monitoring:read'), asyncHandler(async (req, res) => {
  const status = {
    systemHealth: 'healthy',
    activeAlerts: 2,
    performance: 95,
    uptime: 99.9
  }

  res.json({ success: true, data: status })
}))

export default router
