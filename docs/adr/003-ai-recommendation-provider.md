# ADR 003 — AI recommendation provider

## Status
Accepted (updated: OpenAI-compatible provider)

## Context
CEO approvals need agent recommendations. Early stages used static demo heuristics.

## Decision
- Interface `AgentRecommendationProvider` with pluggable beans:
  - `mock` (default) — `MockAgentService`
  - `openai` — `OpenAiAgentRecommendationProvider` (OpenAI-compatible `/chat/completions`)
- Controllers never call an LLM SDK directly
- On LLM failure, OpenAI provider falls back to demo recommendations (availability over purity)
- Capability endpoint: `GET /agents/engine` → `{ demo, label }` for honest UI labeling

## Config
| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `mock` \| `openai` |
| `AI_OPENAI_API_KEY` | required for openai |
| `AI_OPENAI_BASE_URL` | default `https://api.openai.com/v1` (also works with local gateways) |
| `AI_OPENAI_MODEL` | default `gpt-4o-mini` |

## Consequences
- Prod can keep mock until a key is provisioned
- Approved actions still mock-complete (no side-effect execution pipeline yet)
- Frontend should display `engine.label` instead of hardcoding “démo”
