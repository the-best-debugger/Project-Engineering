# LearnLens — Prompt Quality Comparison

---

## Task A — Notes Reviewer

### Missing Components in Original

- Missing: System Instruction — no AI identity defined; model uses generic assistant behaviour and may be verbose or creative.
- Missing: Format — no JSON schema specified, so the model freely chooses structure (prose, lists, grades). This causes frontend fields like `clarity.score` to be absent.
- Missing: Constraints — nothing prohibits markdown, editorialising, or invented facts.
- Present (partial): Context — the note content is injected but not delimited, which can bleed into the prompt and confuse extraction.
- Present (partial): Task — "give feedback" is vague (directional) but lacks explicit scoring requirements and exact field names.

### Original Prompt

```js
systemMsg: ''
userMsg: `give feedback on this note: ${content}`
```

### Rewritten Prompt

The rewritten prompt is implemented in `prompts/rewritten.js` as `TASK_A_PROMPT(content)`. Key parts:

- System message: NoteReview identity and quality standard.
- User message: note wrapped in `--- NOTE START ---` / `--- NOTE END ---`, explicit task, exact JSON schema, and constraints (no markdown, integer scores 0-100, <=200-char feedback).

Example (user message excerpt):

```
--- NOTE START ---
<content>
--- NOTE END ---

Task: Evaluate the note on three dimensions: clarity, completeness, and accuracy.

Format: RETURN ONLY a single valid JSON object exactly matching this shape (no extra fields, no surrounding text):
{
	"clarity": { "score": 0, "feedback": "" },
	"completeness": { "score": 0, "feedback": "" },
	"accuracy": { "score": 0, "feedback": "" },
	"overallScore": 0,
	"topPriority": "clarity"
}

Constraints: Scores must be integers 0-100; feedback <=200 chars; no markdown; do not invent facts.
```

### Test Input Used

Mitosis is when cells divide. There are 4 phases. Prophase is when chromosomes condense.
Metaphase the chromosomes line up. Anaphase they split. Telophase new cells form. DNA
replicates before division starts. This is important for growth and repair.

### Bad Prompt Output

[Run the bad prompt with the test input and paste the raw LLM output here. Command:]

```
node runner.js --task=a --version=bad --temperature=0.7
```

Paste the VERBATIM response below.

```
[BAD PROMPT RAW OUTPUT — paste here]
```

### Good Prompt Output

[Run the good prompt (rewritten) with the same input and paste the raw LLM output here:]

```
node runner.js --task=a --version=good --temperature=0.7
```

Paste the VERBATIM response below.

```
[GOOD PROMPT RAW OUTPUT — paste here]
```

### Improvement

The original prompt lacked a Format specification, which caused inconsistent output shapes (prose, lists, grades) and missing fields; the rewritten prompt's Format requirement produced a consistent JSON object containing `clarity.score`, `completeness.score`, and `accuracy.score` that the frontend can reliably parse.

---

## Task B — Placement Summariser

### Missing Components in Original

- Missing: System Instruction — no role or privacy obligations; model may include personal names or PII.
- Missing: Format — no explicit JSON schema, so fields and types vary (difficulty as word vs number). 
- Missing: Constraints — nothing prohibits names or speculation.
- Present (partial): Context — text injected but not delimited.
- Present (partial): Task — "summarize" is vague about required fields and types.

### Original Prompt

```js
systemMsg: ''
userMsg: `summarize this interview experience: ${text}`
```

### Rewritten Prompt

The rewritten prompt is implemented in `prompts/rewritten.js` as `TASK_B_PROMPT(text)`. Key parts:

- System message: privacy-aware summariser role and obligation to avoid PII.
- User message: text wrapped in `--- TEXT START ---` / `--- TEXT END ---`, explicit task listing company, role, difficulty (1-5 numeric), keyTopics array, and outcome, exact JSON format, constraints (no names, numeric difficulty, no speculation).

Example (user message excerpt):

```
--- TEXT START ---
<text>
--- TEXT END ---

Format: RETURN ONLY a JSON object: {"company":"","role":"","difficulty":1,"keyTopics":["",""],"outcome":""}

Constraints: difficulty must be integer 1-5; do not include personal names; no extra fields or prose.
```

### Test Input Used

I interviewed at Google for a SWE intern role in March. The interview had 3 rounds. First was a screening call, then two technical rounds. They asked me about arrays and dynamic programming. I solved the first problem easily but struggled with the DP one. I was given an offer but turned it down due to relocation. The interviewers were nice and gave good feedback about my problem-solving approach.

### Bad Prompt Output

Run and paste raw output:

```
node runner.js --task=b --version=bad --temperature=0.7
```

```
[BAD PROMPT RAW OUTPUT — paste here]
```

### Good Prompt Output

Run and paste raw output:

```
node runner.js --task=b --version=good --temperature=0.7
```

```
[GOOD PROMPT RAW OUTPUT — paste here]
```

### Improvement

The original prompt lacked Constraints (privacy rules), which allowed personal names and inconsistent difficulty types; the rewritten prompt's Constraints prevented PII and enforced numeric `difficulty`, producing a stable typed JSON response.

---

## Task C — Error Analyst

### Missing Components in Original

- Missing: System Instruction — no defined expert role, so responses are unfocused.
- Missing: Format — no JSON schema demanded, so responses are variable prose without severity or code snippets.
- Missing: Constraints — no rule to avoid speculation; the model may invent causes.
- Present (partial): Context — error message injected but not delimited.
- Present (partial): Task — "why is there a bug" is vague and invites free-form explanations.

### Original Prompt

```js
systemMsg: ''
userMsg: `why is there a bug: ${error_message}`
```

### Rewritten Prompt

The rewritten prompt is implemented in `prompts/rewritten.js` as `TASK_C_PROMPT(error_message)`. Key parts:

- System message: senior backend debugging engineer identity and conservative analysis instruction.
- User message: error wrapped in `--- ERROR START ---` / `--- ERROR END ---`, explicit task naming rootCause, affectedComponent, severity (enum), recommendedFix, and optional codeSnippet; exact JSON format; constraints forbidding speculation and markdown.

Example (user message excerpt):

```
--- ERROR START ---
<error_message>
--- ERROR END ---

Format: RETURN ONLY a JSON object: {"rootCause":"","affectedComponent":"","severity":"medium","recommendedFix":"","codeSnippet":null}

Constraints: severity must be one of [low, medium, high, critical]; no invented files or line numbers beyond the trace; no markdown.
```

### Test Input Used

TypeError: Cannot read properties of undefined (reading 'map')
	at UserList.render (/app/components/UserList.jsx:34:22)
	at processChild (/app/node_modules/react-dom/cjs/react-dom-server.node.development.js:3990:14)
	at resolve (/app/node_modules/react-dom/cjs/react-dom-server.node.development.js:4054:5)
	at ReactDOMServerRenderer.read (/app/node_modules/react-dom/cjs/react-dom-server.node.development.js:4402:29)

### Bad Prompt Output

Run and paste raw output:

```
node runner.js --task=c --version=bad --temperature=0.7
```

```
[BAD PROMPT RAW OUTPUT — paste here]
```

### Good Prompt Output

Run and paste raw output:

```
node runner.js --task=c --version=good --temperature=0.7
```

```
[GOOD PROMPT RAW OUTPUT — paste here]
```

### Improvement

The original prompt lacked a Format specification, which produced free-form prose lacking a `severity` field; the rewritten prompt's Format requirement produced a JSON object with a validated `severity` enum and optional `codeSnippet`, enabling the dashboard to render urgency and provide code fixes reliably.

---

## How to run the harness and capture outputs

1. Copy `.env.example` to `.env` and set `API_KEY` to your LLM-compatible API key and set `LLM_MODEL` if desired.

2. Install dependencies (if not already):

```
npm install
```

3. Run each bad prompt and save its raw output into this file under the appropriate section by running:

```
node runner.js --task=a --version=bad --temperature=0.7
node runner.js --task=b --version=bad --temperature=0.7
node runner.js --task=c --version=bad --temperature=0.7
```

4. Run each good prompt (rewritten) and paste outputs:

```
node runner.js --task=a --version=good --temperature=0.7
node runner.js --task=b --version=good --temperature=0.7
node runner.js --task=c --version=good --temperature=0.7
```

Paste the VERBATIM `RAW RESPONSE` printed by the harness into the matching sections above. Do NOT edit the model outputs; they are the required evidence.

