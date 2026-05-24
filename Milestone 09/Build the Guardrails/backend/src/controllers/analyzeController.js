import { analyzeJobDescription } from '../services/aiService.js'

export async function analyzeController(req, res) {
  const { text } = req.body

  const result = await analyzeJobDescription(text, req.user.id)

  if (result?.fallback === true) {
    return res.status(503).json(result)
  }

  return res.status(200).json({ success: true, analysis: result })
}
