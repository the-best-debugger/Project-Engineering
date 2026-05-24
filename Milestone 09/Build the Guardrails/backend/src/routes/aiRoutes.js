import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { validateAIInput } from '../middleware/validateInput.js'
import { analyzeController } from '../controllers/analyzeController.js'

const router = express.Router()

// Middleware chain order: auth -> rate limit -> input validation -> controller
router.post('/analyze', authMiddleware, aiRateLimit, validateAIInput, analyzeController)

export default router
