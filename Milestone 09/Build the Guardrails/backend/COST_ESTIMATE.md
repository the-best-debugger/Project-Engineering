# AI Feature Cost Estimate

## Feature: JobScan AI — Job description extractor
Problem solved: Extract structured job metadata from freeform job descriptions so I can triage roles faster.

## Token Usage (from 5 real calls logged in production)

| Call | Prompt Tokens | Completion Tokens | Total |
|---|---:|---:|---:|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
| 4 |  |  |  |
| 5 |  |  |  |
| Average |  |  |  |

## Model
Model: openai/gpt-4o-mini
Pricing: fill with Render [AI_USAGE] logs and provider pricing in Phase 4.

## Cost Per Request
(avg_prompt × $/1M) + (avg_completion × $/1M) = $Z

## Monthly Projection (100 users × 5 calls/day × 30 days)
15,000 requests × $Z = $TOTAL/month

## Rate Limit Justification
Initial rate limit: 1 request/hour per user — conservative until we have real usage logs to finalize.


> Note: Fill the token rows above by running 5 real calls in production and copying the `[AI_USAGE]` log lines into this file.
