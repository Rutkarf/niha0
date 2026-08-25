# ADR 005 — Contrats API / DTO (Phase 6)

## Status
Accepted (MVP)

## Context
Le backend expose encore de nombreuses entités JPA sur les endpoints métier. Le frontend dispose de types TypeScript miroirs (`api.models.ts`) et d’un mapping d’erreurs unifié (`ApiErrorResponse` ↔ `mapHttpError`).

## Decision
1. **Erreurs HTTP** : toujours `ApiErrorResponse` via `GlobalExceptionHandler` (status, error, code).
2. **Domain reads/writes** : types FE dans `api.models.ts` / `organization.dto.ts` ; pas de `any` / `$any` dans les templates.
3. **DTOs Java dédiés** : prioritaires pour auth, org, RAG, storage ; extraction progressive pour CRM/tickets sans casser le contrat (mêmes champs JSON).
4. Changement de contrat = mise à jour FE + BE + tests dans le même changement.

## Consequences
- MVP sans couche DTO complète côté BE.
- Dette documentée pour la phase produit fini (OpenAPI codegen possible).
