/**
 * In-memory store and business rules for confessions.
 * Kept in a service so HTTP layers stay thin and this logic stays testable.
 */

let nextConfessionId = 0
const confessions = []

function getAllowedCategories() {
  const raw = process.env.ALLOWED_CATEGORIES
  if (!raw || !String(raw).trim()) {
    return ['bug', 'deadline', 'imposter', 'vibe-code']
  }
  return String(raw)
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean)
}

function isAllowedCategory(category) {
  return getAllowedCategories().includes(category)
}

/**
 * Validates payload for creating a confession.
 * Returns a reason code so the controller can map to the exact legacy HTTP responses.
 */
function validateConfessionInput(requestBody) {
  if (!requestBody) {
    return { ok: false, reason: 'missing_body' }
  }
  // Mirrors original `if (d.text)` gate: empty string and other falsy values yield "need text", not "too short".
  if (!requestBody.text) {
    return { ok: false, reason: 'need_text' }
  }
  if (requestBody.text.length >= 500) {
    return { ok: false, reason: 'text_too_big' }
  }
  if (requestBody.text.length <= 0) {
    return { ok: false, reason: 'too_short' }
  }
  if (!isAllowedCategory(requestBody.category)) {
    return { ok: false, reason: 'invalid_category' }
  }
  return { ok: true }
}

function saveConfession({ text, category }) {
  const newConfession = {
    id: ++nextConfessionId,
    text,
    category,
    created_at: new Date(),
  }
  confessions.push(newConfession)
  return newConfession
}

function formatConfessionResponse(confession) {
  return confession
}

function getAllConfessionsNewestFirst() {
  // Match original behavior: sort in place by created_at descending.
  confessions.sort((first, second) => second.created_at - first.created_at)
  return confessions
}

function buildConfessionListEnvelope(sortedConfessions) {
  return {
    data: sortedConfessions,
    count: sortedConfessions.length,
  }
}

function getConfessionById(confessionId) {
  return confessions.find((confession) => confession.id === confessionId)
}

function getConfessionsByCategory(categorySlug) {
  const filteredConfessions = confessions.filter((confession) => confession.category === categorySlug)
  // Original used filter().reverse() to avoid mutating the main array while reversing order.
  return filteredConfessions.slice().reverse()
}

function removeConfessionById(confessionId) {
  const confessionIndex = confessions.findIndex((confession) => confession.id === confessionId)
  if (confessionIndex === -1) {
    return { removed: false }
  }
  const removedConfessions = confessions.splice(confessionIndex, 1)
  return { removed: true, deletedConfession: removedConfessions[0] }
}

function getConfessionCount() {
  return confessions.length
}

module.exports = {
  getAllowedCategories,
  validateConfessionInput,
  saveConfession,
  formatConfessionResponse,
  getAllConfessionsNewestFirst,
  buildConfessionListEnvelope,
  getConfessionById,
  getConfessionsByCategory,
  removeConfessionById,
  isAllowedCategory,
  getConfessionCount,
}
