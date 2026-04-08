const express = require('express')
const confessionsController = require('../controllers/confessionsController')

const router = express.Router()

router.post('/confessions', confessionsController.createConfession)
router.get('/confessions', confessionsController.listConfessions)
// Registered before `/:id` so `/confessions/category/:cat` is not captured as an id (legacy order was wrong).
router.get('/confessions/category/:cat', confessionsController.getConfessionsByCategory)
router.get('/confessions/:id', confessionsController.getConfessionById)
router.delete('/confessions/:id', confessionsController.deleteConfession)

module.exports = router
