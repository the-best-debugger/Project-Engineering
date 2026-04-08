const confessionService = require('../services/confessionService')

function createConfession(req, res) {
  const confessionData = req.body
  const validation = confessionService.validateConfessionInput(confessionData)

  // Status codes and bodies are mapped explicitly so refactors cannot accidentally drift from the original API contract.
  if (!validation.ok) {
    if (validation.reason === 'missing_body') {
      return res.status(400).json({ msg: 'bad' })
    }
    if (validation.reason === 'need_text') {
      return res.status(400).json({ msg: 'need text' })
    }
    if (validation.reason === 'too_short') {
      return res.status(400).send('too short')
    }
    if (validation.reason === 'text_too_big') {
      return res.status(400).json({
        error: 'text too big, must be less than 500 characters long buddy',
      })
    }
    if (validation.reason === 'invalid_category') {
      return res.status(400).send('category not in stuff')
    }
    return res.status(500).send('error')
  }

  const createdConfession = confessionService.saveConfession({
    text: confessionData.text,
    category: confessionData.category,
  })
  console.log('added one info ' + createdConfession.id)
  const responseBody = confessionService.formatConfessionResponse(createdConfession)
  return res.status(201).json(responseBody)
}

function listConfessions(req, res) {
  const sortedConfessions = confessionService.getAllConfessionsNewestFirst()
  const result = confessionService.buildConfessionListEnvelope(sortedConfessions)
  console.log('fetching all data result')
  return res.json(result)
}

function getConfessionById(req, res) {
  const routeParams = req.params
  const confessionId = parseInt(routeParams.id, 10)
  const foundConfession = confessionService.getConfessionById(confessionId)

  if (!foundConfession) {
    return res.status(404).json({ msg: 'not found' })
  }
  if (!foundConfession.text) {
    return res.status(500).send('broken')
  }
  console.log('found info with ' + foundConfession.text.length + ' chars')
  return res.json(foundConfession)
}

function getConfessionsByCategory(req, res) {
  // Preserves the old route guard: if the param is missing we intentionally do not send a response (legacy behavior).
  if (!req.params.cat) {
    return
  }
  const categoryParam = req.params.cat
  const allowedCategories = confessionService.getAllowedCategories()
  if (!allowedCategories.includes(categoryParam)) {
    return res.status(400).json({ msg: 'invalid category' })
  }
  const filteredConfessions = confessionService.getConfessionsByCategory(categoryParam)
  return res.json(filteredConfessions)
}

function deleteConfession(req, res) {
  const routeParams = req.params
  const expectedDeleteToken = process.env.DELETE_SECRET_TOKEN
  if (req.headers['x-delete-token'] !== expectedDeleteToken) {
    return res.status(403).json({ msg: 'no permission' })
  }
  if (!routeParams.id) {
    return res.status(400).send('no id')
  }
  const confessionId = parseInt(routeParams.id, 10)
  const { removed, deletedConfession } = confessionService.removeConfessionById(confessionId)
  if (!removed) {
    return res.status(404).json({ msg: 'not found buddy' })
  }
  console.log('deleted something')
  return res.json({ msg: 'ok', item: deletedConfession })
}

module.exports = {
  createConfession,
  listConfessions,
  getConfessionById,
  getConfessionsByCategory,
  deleteConfession,
}
