require('dotenv').config()

if (typeof process.env.DELETE_SECRET_TOKEN !== 'string' || process.env.DELETE_SECRET_TOKEN.length === 0) {
  throw new Error('DELETE_SECRET_TOKEN must be set in the environment (see .env.example).')
}

const express = require('express')
const confessionsRoutes = require('./routes/confessions')
const confessionService = require('./services/confessionService')

const app = express()
app.use(express.json())

app.use('/api/v1', confessionsRoutes)

const port = Number(process.env.PORT)
if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be set to a positive integer in the environment (see .env.example).')
}

app.listen(port, function () {
  // Kept as a single log line so ops and coursework demos still see one obvious “server is up” signal.
  const startMessage = `running on ${port}`
  console.log(startMessage)
})

if (confessionService.getConfessionCount() > 500) {
  console.log('too many')
}
