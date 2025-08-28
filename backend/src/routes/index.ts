import { Router } from 'express'
const router = Router()

// Minimal route stubs for all services
const services = ['compliance', 'documents', 'risk', 'analytics', 'monitoring', 'integrations', 'webhooks', 'ai']

services.forEach(service => {
  router.get(`/${service}/status`, (req, res) => {
    res.json({ service, status: 'active', timestamp: new Date().toISOString() })
  })
})

export default router