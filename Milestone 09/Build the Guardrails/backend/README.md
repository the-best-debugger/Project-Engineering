# JobScan AI — Final Feature README

I personally have this problem: I review many job descriptions and waste time manually extracting required skills and seniority. My AI feature solves it by returning a strict JSON summary (title, experienceLevel, requiredSkills, responsibilities, salaryRange, industryType, remotePolicy, confidence) so I can quickly filter and triage roles.

## Phase 1 — Design (Q1–Q4)

Q1 — What is the exact input?
- The API accepts a single JSON body with one field:

```json
{ "text": "<job description text (string)>" }
```

Notes: `text` is plain text or markdown (string). Clients must authenticate with a Bearer JWT.

Q2 — What is the exact output?
- The LLM must return the following JSON object, exactly as described (types):

```json
{
  "title": "string",
  "experienceLevel": "junior | mid | senior | lead",
  "requiredSkills": ["string"],
  "responsibilities": ["string"],
  "salaryRange": "string",
  "industryType": "string",
  "remotePolicy": "remote | hybrid | onsite | unspecified",
  "confidence": "high | medium | low"
}
```

The system prompt enforces strict JSON-only output (no markdown or explanation).

Q3 — What model serves this task? Justification (one sentence)
- Model: `openai/gpt-4o-mini` — chosen because it provides a good balance between structured-output reliability for JSON tasks and latency/cost suitable for a production extraction job.

Q4 — What is the rate limit and why?
- Rate limit (initial): **1 request / user / hour**.
- Why: We must guarantee that a single user cannot exceed $0.01/hour in worst-case token usage before we have production token measurements. Using a conservative worst-case estimate (prompt + completion ≤ 2,600 tokens) and a conservative price estimate (≈ $2 / 1M tokens), worst-case cost per request ≈ (2600 / 1,000,000) * $2 ≈ $0.0052. With 1 request/hour the worst-case cost ≤ $0.0052 < $0.01/hour. This is intentionally conservative — Phase 4 will replace estimates with real `[AI_USAGE]` logs and we will relax this limit accordingly.

---

I will now scaffold the backend (promptBuilder, aiService with timeout+logging, auth, rate limiter, input validator, routes, and server). The prompt logic will live exclusively in `backend/src/utils/promptBuilder.js`.
