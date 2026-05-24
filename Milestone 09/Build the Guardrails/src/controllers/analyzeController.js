// src/controllers/analyzeController.js
import { analyzeJobDescription } from '../services/aiService.js'

export async function analyzeController(req, res) {
  const { text } = req.body

  // Guardrail 1: Empty input check
  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      error: 'input_required',
      message: 'Job description text is required.'
    })
  }

  // Guardrail 1: Length validation (hard limit)
  if (text.length > 3000) {
    return res.status(400).json({
      error: 'input_too_long',
      limit: 3000,
      received: text.length
    })
  }

  // Call AI service — the service now returns a fallback object on timeout/error
  const result = await analyzeJobDescription(text, req.user.id)

  // Guardrail 3: if the AI service returned a fallback response, surface 503
  if (result?.fallback === true) {
    return res.status(503).json(result)
  }

  return res.status(200).json({
    success: true,
    analysis: result,
    characterCount: text.length
  })
}
