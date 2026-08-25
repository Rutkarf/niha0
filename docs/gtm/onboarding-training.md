# Onboarding & formation — NIHAO agents

Playbook court pour activer Studio, Marketplace et Chat après inscription.

## Jour 0 — Accès

1. Créer le workspace (`/app/onboarding`) et compléter le profil organisation.
2. Vérifier le plan (Paramètres) : packs Agents inclus BUSINESS, add-on PRO.
3. Ouvrir **AI Office** (`O`) pour situer les agents métier.

## Jour 1 — Chat

1. Aller sur [`/app/chat`](/app/chat).
2. Créer un fil, envoyer un message (guardrails + mémoire session côté API).
3. Relier le besoin métier à un agent (CRM, Stock, Support).

## Jour 2 — Studio

1. Ouvrir [`/app/studio`](/app/studio).
2. Créer une définition (slug, nom, `graphJson` template start→llm→end).
3. Ajouter un nœud, enregistrer, puis **Publier** (visibilité privée).

## Jour 3 — Marketplace & runtime

1. Catalogue : [`/app/marketplace`](/app/marketplace) — installer une annonce.
2. Runtime : [`/app/runtime`](/app/runtime) — démarrer un run, consulter les steps, reprendre si `WAITING_HUMAN`.
3. Gouvernance (ADMIN/OWNER) : [`/app/governance`](/app/governance) — permissions, eval, scan guardrail.

## Ressources

- Cas d’usage : `docs/gtm/use-cases.md`
- Architecture : `docs/architecture/map.md`
- Plan d’action : `docs/NIHAO_05_PLAN_ACTION_COMPLET.md`
