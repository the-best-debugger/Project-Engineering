import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import aiRoutes from './routes/aiRoutes.js'

dotenv.config()

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is required. Add it to .env and to Render environment variables.')
}

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', aiRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`JobScan AI backend listening on ${port}`)
})
