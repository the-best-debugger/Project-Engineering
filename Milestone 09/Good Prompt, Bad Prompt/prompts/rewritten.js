// prompts/rewritten.js

// Task A — Notes Reviewer
// System Instruction: define NoteReview's identity and quality standard
// Context: NOTE START / NOTE END delimiters around the content
// Task: explicitly name clarity, completeness, accuracy
// Format: exact JSON schema required by UI
// Constraints: no markdown, no editorialising, no hallucination
export const TASK_A_PROMPT = (content) => {
  const systemMsg = `You are NoteReview — an expert educational reviewer for student study notes. Provide objective, evidence-based evaluations. Use numeric scores and concise, actionable feedback. Do not refer to or reveal student identity.`

  const userMsg = `--- NOTE START ---\n${content}\n--- NOTE END ---\n\nTask: Evaluate the note on three dimensions: clarity, completeness, and accuracy. For each dimension provide a numeric score (integer 0-100) and a short feedback string. Also compute an overallScore (integer 0-100) and set topPriority to one of: \"clarity\", \"completeness\", or \"accuracy\" indicating the single biggest improvement area.\n\nFormat: RETURN ONLY a single valid JSON object exactly matching this shape (no extra fields, no surrounding text):\n{\n  "clarity": { "score": 0, "feedback": "" },\n  "completeness": { "score": 0, "feedback": "" },\n  "accuracy": { "score": 0, "feedback": "" },\n  "overallScore": 0,\n  "topPriority": "clarity"\n}\n\nConstraints:\n- Scores must be integers between 0 and 100.\n- Feedback strings must be <= 200 characters.\n- Do NOT include markdown, code fences, or any explanation outside the JSON.\n- Do NOT invent facts not present in the note.\n- Do NOT mention student names or identities.`

  return { systemMsg, userMsg }
}

// Task B — Placement Summariser
// System Instruction: define privacy-aware summariser role
// Context: TEXT START / TEXT END delimiters
// Task: produce company, role, difficulty (1-5 numeric), keyTopics array, one-sentence outcome
// Format: exact JSON with types specified
// Constraints: no personal names, numeric difficulty, no speculation
export const TASK_B_PROMPT = (text) => {
  const systemMsg = `You are LearnLens PlacementSummariser. Prioritise privacy and factuality. Never output personal names or personally-identifying details. Return concise, factual summaries suitable for rendering in a UI card.`

  const userMsg = `--- TEXT START ---\n${text}\n--- TEXT END ---\n\nTask: Summarise the interview experience into these five fields: company, role, difficulty, keyTopics, outcome.\n\nFormat: RETURN ONLY a single valid JSON object exactly matching this shape:\n{\n  "company": "",\n  "role": "",\n  "difficulty": 1,\n  "keyTopics": ["", ""],\n  "outcome": ""\n}\nWhere: difficulty is an integer from 1 (easiest) to 5 (hardest); keyTopics is an array of short topic strings; outcome is a single-sentence summary.\n\nConstraints:\n- Do NOT include any person names or contact information.\n- Difficulty MUST be a number (1-5).\n- Do NOT infer details beyond the provided text.\n- Do NOT include extra fields or explanatory prose outside the JSON.`

  return { systemMsg, userMsg }
}

// Task C — Error Analyst
// System Instruction: senior backend debugging engineer
// Context: ERROR START / ERROR END delimiters
// Task: provide rootCause, affectedComponent, severity (enum), recommendedFix, optional codeSnippet
// Format: exact JSON, severity enum enforced
// Constraints: no markdown, no speculation beyond trace
export const TASK_C_PROMPT = (error_message) => {
  const systemMsg = `You are a senior backend debugging engineer. Analyse stack traces and logs conservatively: prefer provable observations from the trace and give actionable remediation steps. Do not speculate beyond the evidence.`

  const userMsg = `--- ERROR START ---\n${error_message}\n--- ERROR END ---\n\nTask: Analyse the error and return a JSON object with these fields: rootCause, affectedComponent, severity, recommendedFix, codeSnippet (optional).\n\nFormat: RETURN ONLY a single valid JSON object exactly matching this shape:\n{\n  "rootCause": "",\n  "affectedComponent": "",\n  "severity": "medium",\n  "recommendedFix": "",\n  "codeSnippet": null\n}\nWhere severity MUST be one of: \"low\", \"medium\", \"high\", \"critical\". If you include a codeSnippet it must be a short, minimal snippet as a string (no markdown fences).\n\nConstraints:\n- Do NOT invent files, line numbers, or stack frames not present in the trace.\n- Do NOT include markdown or explanatory prose outside the JSON.\n- severity must be one of the four allowed values.\n- recommendedFix should be actionable (one or two short steps) and <= 300 characters.`

  return { systemMsg, userMsg }
}
// prompts/rewritten.js
// Students: implement all three prompts using the five-component structure.
// Each prompt must have: system instruction, context with delimiters, task, format (JSON shape), constraints.
// Label each section with a comment.

// Task A — Notes Reviewer
export const TASK_A_PROMPT = (content) => ({
  systemMsg: '', // TODO: add system instruction
  userMsg: ''    // TODO: add context + task + format + constraints
})

// Task B — Placement Summariser
export const TASK_B_PROMPT = (text) => ({
  systemMsg: '',
  userMsg: ''
})

// Task C — Error Analyst
export const TASK_C_PROMPT = (error_message) => ({
  systemMsg: '',
  userMsg: ''
})
