import { Router } from 'express'
const router = Router()

router.get('/status', (req, res) => {
  res.json({ service: 'auth', status: 'active' })
})

export default router