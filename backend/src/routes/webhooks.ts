import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Get webhooks
router.get('/', auth, requirePermission('webhooks:read'), asyncHandler(async (req, res) => {
  const webhooks = [
    {
      id: 'webhook_001',
      name: 'Compliance Alert Webhook',
      url: 'https://api.example.com/webhooks/compliance',
      events: ['workflow.completed', 'risk.high'],
      status: 'active'
    }
  ]

  res.json({ success: true, data: webhooks })
}))

export default router
