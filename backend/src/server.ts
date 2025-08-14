import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()

// Import database connections
import { connectMongoDB } from './config/database'
import { connectRedis } from './config/redis'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

// Import routes
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import regulatoryRoutes from './routes/regulatory'
import complianceRoutes from './routes/compliance'
import documentsRoutes from './routes/documents'
import riskRoutes from './routes/risk'
import analyticsRoutes from './routes/analytics'
import monitoringRoutes from './routes/monitoring'
import integrationsRoutes from './routes/integrations'
import webhooksRoutes from './routes/webhooks'
import aiRoutes from './routes/ai'

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

app.use(cors(corsOptions))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', limiter)

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
const apiVersion = process.env.API_VERSION || 'v1'
app.use(`/api/${apiVersion}/auth`, authRoutes)
app.use(`/api/${apiVersion}/dashboard`, dashboardRoutes)
app.use(`/api/${apiVersion}/regulatory`, regulatoryRoutes)
app.use(`/api/${apiVersion}/compliance`, complianceRoutes)
app.use(`/api/${apiVersion}/documents`, documentsRoutes)
app.use(`/api/${apiVersion}/risk`, riskRoutes)
app.use(`/api/${apiVersion}/analytics`, analyticsRoutes)
app.use(`/api/${apiVersion}/monitoring`, monitoringRoutes)
app.use(`/api/${apiVersion}/integrations`, integrationsRoutes)
app.use(`/api/${apiVersion}/webhooks`, webhooksRoutes)
app.use(`/api/${apiVersion}/ai`, aiRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`)

  // Join user to their personal room
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`)
    logger.info(`User ${userId} joined personal room`)
  })

  // Handle workflow collaboration
  socket.on('join-workflow', (workflowId: string) => {
    socket.join(`workflow-${workflowId}`)
    socket.to(`workflow-${workflowId}`).emit('user-joined-workflow', {
      socketId: socket.id,
      timestamp: new Date()
    })
  })

  // Handle document collaboration
  socket.on('join-document', (documentId: string) => {
    socket.join(`document-${documentId}`)
    socket.to(`document-${documentId}`).emit('user-joined-document', {
      socketId: socket.id,
      timestamp: new Date()
    })
  })

  // Handle real-time notifications
  socket.on('subscribe-notifications', (userId: string) => {
    socket.join(`notifications-${userId}`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Database connections
async function initializeDatabase() {
  try {
    await connectMongoDB()
    await connectRedis()
    logger.info('All database connections established')
  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Start server
const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await initializeDatabase()
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`)
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${apiVersion}`)
      logger.info(`💾 MongoDB: ${process.env.MONGODB_URI}`)
      logger.info(`🔴 Redis: ${process.env.REDIS_URL}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export { app, io }
