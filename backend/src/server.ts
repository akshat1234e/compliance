import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { connectMongoDB } from './config/database'
import { connectRedis } from './config/redis'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import regulatoryRoutes from './routes/regulatory'
import allRoutes from './routes/index'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.get('/api/v1/status', (req, res) => {
  res.json({ message: 'RBI Compliance Backend API is running' })
})

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/regulatory', regulatoryRoutes)
app.use('/api/v1', allRoutes)

async function startServer() {
  try {
    await connectMongoDB()
    await connectRedis()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
