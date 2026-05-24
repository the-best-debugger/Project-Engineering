const SYSTEM_PROMPT = `You are an expert job description analyser.
Analyse the provided job description and return ONLY a JSON object with these exact fields:
{
  "title": "inferred job title",
  "experienceLevel": "junior OR mid OR senior OR lead",
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "salaryRange": "estimated range based on role and level, e.g. $80k-$120k",
  "industryType": "inferred industry",
  "remotePolicy": "remote OR hybrid OR onsite OR unspecified",
  "confidence": "high OR medium OR low"
}
Return ONLY valid JSON. No markdown. No explanation text.`

export function buildPrompt(userInput) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `[Job Description]: ${userInput}` }
  ]
}

export { SYSTEM_PROMPT }
