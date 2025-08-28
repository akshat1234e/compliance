import { Router } from 'express'
const router = Router()

router.get('/stats', (req, res) => {
  res.json({ 
    totalTasks: 42,
    completedTasks: 28,
    pendingTasks: 14,
    riskScore: 85
  })
})

export default router