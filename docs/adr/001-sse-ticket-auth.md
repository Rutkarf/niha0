# Architecture decision — SSE authentication without JWT in query strings
#
# Context: EventSource cannot set Authorization headers. Previously the JWT was
# passed as ?token=, which leaks credentials via logs, Referer, and browser history.
#
# Decision: short-lived, single-use SSE tickets.
# 1. Authenticated client: POST /api/realtime/ticket (Bearer JWT) → { ticket, expiresInMs }
# 2. EventSource connects to GET /api/realtime/events?ticket=…
# 3. JwtAuthFilter consumes the ticket once (TTL 30s) and establishes SecurityContext.
# 4. ?token= JWT query param is rejected with 401.
#
# Trade-off: reconnect requires a new ticket (RealtimeService reconnects via HTTP).
# Alternative considered: HttpOnly cookie — deferred to avoid CSRF/SameSite complexity
# with the current Bearer-first SPA model.
#
# Status: implemented (task 6 / Phase 7 security).
