import 'dotenv/config'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'

// Usage: node scripts/run_tests.js --inputPrice=... --outputPrice=... [--secondModel=name,inputPrice,outputPrice]
// Example: node scripts/run_tests.js --inputPrice=20 --outputPrice=20 --secondModel=openai/gpt-3.5-turbo,10,10

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
if (!OPENROUTER_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not set in .env')
  process.exit(1)
}

const args = process.argv.slice(2)
const argMap = {}
args.forEach(a => {
  const [k, v] = a.replace(/^-+/,'').split('=')
  argMap[k] = v
})

const inputPrice = parseFloat(argMap.inputPrice)
const outputPrice = parseFloat(argMap.outputPrice)
const secondModelArg = argMap.secondModel // format: name,inputPrice,outputPrice
let secondModel = null
if (secondModelArg) {
  const parts = secondModelArg.split(',')
  secondModel = { name: parts[0], inputPrice: parseFloat(parts[1]), outputPrice: parseFloat(parts[2]) }
}

const TEST_FILES = [
  'test/short-note.txt',
  'test/medium-note.txt',
  'test/long-note.txt',
  'test/extra-short.txt',
  'test/extra-long.txt'
]

const SYSTEM_PROMPT = `You are an academic study assistant. Analyze the provided notes and return a structured JSON response with exactly these three fields:\n- overview: A 3-sentence summary of the main topic\n- keyConcepts: An array of exactly 5 key concepts as strings\n- examQuestions: An array of exactly 2 likely exam questions as strings\n\nReturn ONLY valid JSON. No markdown. No explanation. Just the JSON object.`

async function callOpenRouter(note) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: note }
      ],
      max_tokens: 500,
      temperature: 0.3
    })
  })

  const data = await res.json()
  return data
}

async function run() {
  const results = []
  for (let file of TEST_FILES) {
    const filePath = path.join(process.cwd(), file)
    const note = fs.readFileSync(filePath, 'utf8')
    console.log(`\n--- Calling OpenRouter for ${file} ---`)
    try {
      const data = await callOpenRouter(note)
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      const usageLog = {
        timestamp: new Date().toISOString(),
        userId: 'test-runner',
        model: 'openai/gpt-4o-mini',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        endpoint: 'summarize_note',
        file
      }
      console.log('[AI_USAGE]', JSON.stringify(usageLog))

      const choiceContent = data?.choices?.[0]?.message?.content || ''

      results.push({ file, usage: usageLog, content: choiceContent })

    } catch (err) {
      console.error('Call failed for', file, err.message)
    }
  }

  // Compute averages
  const avgPrompt = Math.round(results.reduce((s, r) => s + (r.usage.promptTokens || 0), 0) / results.length)
  const avgCompletion = Math.round(results.reduce((s, r) => s + (r.usage.completionTokens || 0), 0) / results.length)
  const avgTotal = Math.round(results.reduce((s, r) => s + (r.usage.totalTokens || 0), 0) / results.length)

  console.log('\n--- Averages ---')
  console.log('avgPrompt:', avgPrompt, 'avgCompletion:', avgCompletion, 'avgTotal:', avgTotal)

  if (!inputPrice || !outputPrice) {
    console.log('\nPricing not supplied. To compute costs, re-run with: --inputPrice=XX --outputPrice=YY and optionally --secondModel=name,inputPrice,outputPrice')
    // Save raw results for manual processing
    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2))
    console.log('Wrote test_results.json')
    return
  }

  // Compute cost for primary model
  const costPerReq = (avgPrompt * (inputPrice / 1_000_000)) + (avgCompletion * (outputPrice / 1_000_000))
  const daily10 = costPerReq * 10 * 5
  const daily100 = costPerReq * 100 * 5
  const monthly100 = daily100 * 30

  console.log('\n--- Cost Projection (primary model) ---')
  console.log('Model: openai/gpt-4o-mini')
  console.log('Avg tokens/req:', avgTotal)
  console.log('Cost per request (USD):', costPerReq.toFixed(6))
  console.log('Daily (10 users, 5 calls):', daily10.toFixed(6))
  console.log('Daily (100 users, 5 calls):', daily100.toFixed(6))
  console.log('Monthly (100 users):', monthly100.toFixed(6))

  // second model if provided
  if (secondModel) {
    const costPerReq2 = (avgPrompt * (secondModel.inputPrice / 1_000_000)) + (avgCompletion * (secondModel.outputPrice / 1_000_000))
    const d10_2 = costPerReq2 * 10 * 5
    const d100_2 = costPerReq2 * 100 * 5
    const m100_2 = d100_2 * 30
    console.log('\n--- Cost Projection (second model) ---')
    console.log('Model:', secondModel.name)
    console.log('Cost per request (USD):', costPerReq2.toFixed(6))
    console.log('Daily (10 users, 5 calls):', d10_2.toFixed(6))
    console.log('Daily (100 users, 5 calls):', d100_2.toFixed(6))
    console.log('Monthly (100 users):', m100_2.toFixed(6))
  }

  // Save results
  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2))
  console.log('\nWrote test_results.json with raw data and usage')
}

run()
