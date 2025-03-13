import { logger } from 'robo.js'

// Get the HOST and PORT from environment variables or use defaults
const host = process.env.HOST || '0.0.0.0'
const port = parseInt(process.env.PORT || '8080', 10)

// Log the server configuration that will be applied
logger.info(`⚙️ Server configuration:`)
logger.info(`   - Binding to: ${host}:${port}`)
logger.info(`   - CORS: enabled`)

export default {
	cors: true,
	address: host,
	port: port
}
