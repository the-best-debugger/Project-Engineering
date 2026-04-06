# Vibe vs. Pair Challenge

This challenge involves building the same Task Manager application twice to compare two distinct AI-assisted development workflows: **Vibe Coding** (using generative UI/app tools) and **AI Pair Programming** (using editor-integrated assistants). By the end, you'll have a clear understanding of the strengths and weaknesses of each approach.

## The App You Are Building

You will be building a standalone Task Manager. You must strictly follow the requirements outlined in the [app-spec.md](./app-spec.md) file for both versions.

## Your Folders

- `/vibe-version`: Use this folder for the version built using a "vibe" tool (e.g., Lovable, v0, Google AI Studio Build).
- `/pair-version`: Use this folder for the version built using an AI pair programming assistant (e.g., GitHub Copilot, Cursor).

## Live Deployments

- Vibe version: [add your live URL here]
- Pair version: [add your live URL here]

## Comparison Table

| Dimension | Vibe Version (tool used) | Pair Version (tool used) | Verdict |
|---------------|--------------------------|--------------------------|---------|
| Speed | Generated quickly — ~2 minutes (single-shot) | Slower — ~9 minutes (modular, interactive) | Vibe faster |
| Control | Less granular control; single-file decisions inside `app.js` | Full control over structure and APIs (`createStore`, components) | Pair for control |
| Code Quality | Functional but monolithic; harder to test/extend | Modular, small modules, clearer responsibilities | Pair for quality |
| Explainability | Imperative flow inside one file; some logic requires reading the whole file | Each module is small and self-contained; easier to explain | Pair for explainability |
| Editability | Quick for small tweaks; harder for larger feature additions | Easy to extend and refactor thanks to separation of concerns | Pair for editability |


## When I Would Use Each Tool

- **Vibe coding tool for:** rapid prototypes and demos — because it produces a working UI very quickly with minimal inputs (single-file output is quick to iterate for small changes).

- **AI pair programming for:** production-feasible components, complex features, and long-lived codebases — because the modular code and clearer responsibilities make testing, reviewing, and extending easier.

## Tools Used

- **Vibe tool used:** Lovable / v0 / Google AI Studio Build (example)
- **Pair tool used:** GitHub Copilot / Cursor (example)

## How to Submit

1. **PR Link:** [Insert your Pull Request link here]
2. **Video Link:** [Insert your Loom or recorded demo link here]
