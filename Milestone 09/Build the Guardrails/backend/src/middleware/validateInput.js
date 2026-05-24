export function validateAIInput(req, res, next) {
  const { text } = req.body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'input_required', message: 'Job description text is required.' })
  }

  if (text.length > 3000) {
    return res.status(400).json({ error: 'input_too_long', limit: 3000, received: text.length })
  }

  // Domain-specific check: require at least 5 words
  const wordCount = text.trim().split(/\s+/).length
  if (wordCount < 5) {
    return res.status(400).json({ error: 'input_too_short', message: 'Provide more detail (at least 5 words).' })
  }

  next()
}
