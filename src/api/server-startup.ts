import { logger } from 'robo.js'

/**
 * Server Startup Configuration Logger
 * 
 * This file will be automatically loaded by Robo.js during server initialization.
 * We're logging the current environment variables and configuration to help
 * diagnose deployment issues.
 */

// Log server startup information
logger.info('🚀 Server starting up...')

// Log environment variables
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || '8080'

logger.info(`📌 Server environment configuration:`)
logger.info(`   - HOST: ${host}`)
logger.info(`   - PORT: ${port}`)
logger.info(`   - NODE_ENV: ${process.env.NODE_ENV}`)

// Log additional environment variables that might be useful for debugging
logger.info(`📋 Discord configuration:`)
logger.info(`   - DISCORD_CLIENT_ID: ${process.env.DISCORD_CLIENT_ID ? '✅ Set' : '❌ Not Set'}`)
logger.info(`   - DISCORD_CLIENT_SECRET: ${process.env.DISCORD_CLIENT_SECRET ? '✅ Set' : '❌ Not Set'}`)

// Force the server to bind to 0.0.0.0 in production
if (process.env.NODE_ENV === 'production') {
  logger.info('🔒 Production environment detected, ensuring server binds to 0.0.0.0')
  process.env.HOST = '0.0.0.0'
}

// Log final binding information
logger.info(`📡 Server will bind to ${process.env.HOST || '0.0.0.0'}:${process.env.PORT || '8080'}`)

export default {} 