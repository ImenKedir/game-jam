import { logger } from 'robo.js'
import { setupEnhancedLogging } from '../utils/logger'

/**
 * Server Initialization
 * 
 * This file will be automatically loaded by Robo.js at startup.
 * It initializes the enhanced logging and prints diagnostic information
 * to help debug server binding issues.
 */

// Set up enhanced logging
setupEnhancedLogging()

// Log server startup information
logger.info('🚀 Server initializing...')

// Log environment variables
logger.info(`📌 Environment configuration:`)
logger.info(`   - NODE_ENV: ${process.env.NODE_ENV}`)
logger.info(`   - HOST: ${process.env.HOST || '0.0.0.0'} (default: 0.0.0.0)`)
logger.info(`   - PORT: ${process.env.PORT || '8080'} (default: 8080)`)

// Log platform information
logger.info(`🖥️ Platform information:`)
logger.info(`   - Platform: ${process.platform}`)
logger.info(`   - Architecture: ${process.arch}`)
logger.info(`   - Node.js: ${process.version}`)

// Force the server to bind to 0.0.0.0 in production to prevent the 502 error
if (process.env.NODE_ENV === 'production') {
  const originalHost = process.env.HOST
  process.env.HOST = '0.0.0.0'
  
  if (originalHost !== process.env.HOST) {
    logger.info(`⚠️ Host environment variable changed from ${originalHost || 'undefined'} to 0.0.0.0 for production`)
  }
  
  logger.info(`🔒 Production mode: Server will bind to 0.0.0.0:${process.env.PORT || '8080'}`)
} else {
  logger.info(`🔧 Development mode: Server will bind to ${process.env.HOST || '0.0.0.0'}:${process.env.PORT || '8080'}`)
}

// Export an empty object as required by Robo.js
export default {} 