# ADR 007 — Realtime scaling

## Status
Accepted (interim)

## Context
`RealtimeEventBroadcaster` is JVM-local (`ConcurrentHashMap`). Multiple backend replicas will not share SSE events.

## Decision (0.2.0)
Single-instance SSE is acceptable for pilot.

## Next
Add Redis pub/sub: publish domain events; each instance fans out to local SSE emitters. Rate-limit tickets via Redis. Sticky sessions optional.

## Consequences
Horizontal scale of `/realtime/events` requires ADR implementation before multi-replica prod.
