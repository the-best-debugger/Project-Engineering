import fetch from 'node-fetch'
import { buildPrompt } from '../utils/promptBuilder.js'

const MODEL = 'openai/gpt-4o-mini'

export async function analyzeJobDescription(text, userId) {
  const controller = new AbortController()
  const timeoutMs = 15000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const messages = buildPrompt(text)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 600, temperature: 0.2 }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`LLM API Error: ${response.status} ${txt}`)
    }

    const data = await response.json()

    if (data.usage) {
      console.log('[AI_USAGE]', JSON.stringify({
        timestamp: new Date().toISOString(),
        userId,
        model: MODEL,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        endpoint: 'analyze_job_description'
      }))
    }

    const content = data?.choices?.[0]?.message?.content

    try {
      return JSON.parse(content)
    } catch (err) {
      return {
        title: 'Unknown',
        experienceLevel: 'unknown',
        requiredSkills: [],
        responsibilities: [],
        salaryRange: 'unspecified',
        industryType: 'unknown',
        remotePolicy: 'unspecified',
        confidence: 'low',
        rawContent: content
      }
    }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      console.error('[AI_TIMEOUT]', JSON.stringify({ timestamp: new Date().toISOString(), userId, timeoutMs }))
    } else {
      console.error('[AI_ERROR]', JSON.stringify({ timestamp: new Date().toISOString(), userId, error: err.message }))
    }

    return { success: false, fallback: true, message: 'Analysis unavailable. Please try again shortly.' }
  }
}
