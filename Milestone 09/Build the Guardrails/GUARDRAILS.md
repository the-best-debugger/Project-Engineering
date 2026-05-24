# JobScan AI — Production Guardrails

## Phase 1: Failures Observed

### Failure 1 — Unlimited Input Length
Observed: [describe what happened when you submitted 5000 chars]
AI service called: [YES — token log appeared in terminal]

### Failure 2 — Indefinite Hang
Observed: [describe what happened with artificial delay]
Duration: [X seconds before timeout or manual cancel]

### Failure 3 — Server Crash on LLM Error
Observed: [paste the TypeError message from terminal]
Server state after crash: [describe — could it respond to /health?]

---

## Guardrail 1 — Input Length Validation

**What was added:** In `src/controllers/analyzeController.js` we added two upfront checks before calling the AI service:

- Empty input check that returns HTTP 400 with JSON:

```json
{ "error": "input_required", "message": "Job description text is required." }
```

- Length validation that returns HTTP 400 when the input exceeds 3000 characters:

```json
{ "error": "input_too_long", "limit": 3000, "received": <number> }
```

This check is performed before `analyzeJobDescription()` is invoked, ensuring the AI service is never called for invalid inputs.

**What it protects against:** Prevents very large inputs from being forwarded to the LLM, avoiding excessive token usage, runaway cost, and long-running external calls.

**Production incident it prevents:** A user or attacker submitting a 50,000-character job posting causing massive token billing and degraded service for all users.

---

## Guardrail 2 — Request Timeout

**What was added:** In `src/services/aiService.js` the OpenRouter fetch call is wrapped with an `AbortController` and a 15,000ms timeout. If the request does not complete within 15s the controller aborts the fetch; the catch block logs an `[AI_TIMEOUT]` JSON entry and the service returns a fallback object:

```json
{ "success": false, "fallback": true, "message": "Analysis unavailable. Please try again shortly." }
```

The `signal` is passed to `fetch`, and `clearTimeout()` is called on both success and error paths.

**What it protects against:** Prevents the server from hanging indefinitely when the LLM provider is slow or unresponsive, avoiding thread exhaustion and cascading failures.

**Production incident it prevents:** A slow downstream provider causing requests to queue for minutes and the API becoming unresponsive to healthy traffic.

---

## Guardrail 3 — LLM Failure Handling

**What was added:** Also in `src/services/aiService.js` the LLM call is wrapped in a `try/catch`. Non-timeout errors are logged with an `[AI_ERROR]` JSON entry including timestamp, `userId`, and the error message. The service returns the same fallback object as above. In `src/controllers/analyzeController.js` the controller detects `result.fallback === true` and returns HTTP 503 with the fallback payload.

**What it protects against:** Prevents uncaught exceptions from LLM errors (for example 401/403/500 responses or malformed responses) from crashing the Node.js process and taking the entire service down.

**Production incident it prevents:** A provider outage or invalid API key causing an unhandled exception and bringing the service down at 02:13am for all users.
