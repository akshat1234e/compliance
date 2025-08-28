import { Router } from 'express'
const router = Router()

router.get('/updates', (req, res) => {
  res.json([
    { id: 1, title: 'RBI Circular Update', date: '2024-01-15', status: 'active' }
  ])
})

export default router