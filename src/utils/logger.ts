import { logger, Logger } from 'robo.js'

/**
 * Enhanced Logger
 * 
 * Extends the Robo.js logger with additional features like timestamps
 * and contextual information for better debugging.
 */

// Override the default logger with enhanced methods
export function setupEnhancedLogging() {
  // Store original methods
  const originalInfo = logger.info
  const originalWarn = logger.warn
  const originalError = logger.error
  const originalDebug = logger.debug

  // Add timestamp to all log messages
  function getTimestamp() {
    return `[${new Date().toISOString()}]`
  }

  // Add environment context
  function getEnvironmentContext() {
    return process.env.NODE_ENV === 'production' ? '[PROD]' : '[DEV]'
  }

  // Override methods with enhanced versions
  logger.info = (...args: any[]) => {
    originalInfo(getTimestamp(), getEnvironmentContext(), ...args)
  }

  logger.warn = (...args: any[]) => {
    originalWarn(getTimestamp(), getEnvironmentContext(), ...args)
  }

  logger.error = (...args: any[]) => {
    originalError(getTimestamp(), getEnvironmentContext(), ...args)
  }

  logger.debug = (...args: any[]) => {
    originalDebug(getTimestamp(), getEnvironmentContext(), ...args)
  }

  // Log that enhanced logging is set up
  logger.info('📝 Enhanced logging initialized')
}

// Create a log context helper
export function createContextLogger(context: string): Pick<Logger, 'info' | 'warn' | 'error' | 'debug'> {
  return {
    info: (...args: any[]) => logger.info(`[${context}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${context}]`, ...args),
    error: (...args: any[]) => logger.error(`[${context}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${context}]`, ...args),
  }
} 