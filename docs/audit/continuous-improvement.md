# Continuous improvement log — NIHAO

## Cycle 1 — Thème AI Office + AUTO scheduling
- Interrupteur `ThemeSwitcherComponent` dans AI Office (☀ / 🌙 / ◐)
- `ThemeService` : cycle Solar→Cyber→Auto, timer exact 08:00 / 20:00
- API `GET/PUT /theme-preferences` + hydrate au login
- Persistance localStorage + PostgreSQL

## Cycle 2 — Sécurité temps réel
- JWT `?token=` accepté uniquement sur `/realtime/events`
- SSE isolé par `organizationId`
- Broadcasts agents/approvals enrichis avec `organizationId`
- Frontend écoute événements nommés SSE

## Cycle 3 — Perf / UX
- Pause rendu Three.js si onglet caché
- Disclaimer juridique
- Dashboard : CTA validations + lien AI Office
- `application-prod.yml` : Swagger off, JWT_SECRET requis

## Cycle 4 — AI Center actionable + CRM write
- `ApiService` : `createCustomer`, `createLead`, `recommendAgentAction`
- AI Center : boutons Recommander / Approuver / Reporter / Refuser + liens module & 3D
- CRM : formulaire création client (POST)
- `WorkflowStatus` : `DEFERRED` / `MODIFIED`
- Sécurité : `/actuator/info` authentifié (seul `/actuator/health` public)

## Cycle 5 — Rendu global professionnel
- Typo **Syne** (display) + **Outfit** (UI) + IBM Plex Mono
- Thèmes recentrés : Night Ops (slate/cyan) + Solar Ops (forêt), moins de glow/violet
- Shell : topbar sticky glass, avatar initiales, sidebar codes mono (plus d’emojis)
- Login brand-first (2 colonnes), KPI/table/badges/empty states affinés
- AI Office header + canvas plus nets

## Loop protocol (dynamic)
- **Pas** de `while true` fixe.
- Fin de tick → réarmer immédiatement un one-shot : `sleep 5` puis `AGENT_LOOP_WAKE_nihao_ui`.
- Au wake : polish UI → build → maj ce fichier → **réarmer** le prochain wake.

## Cycle 5b — Loading / theme switcher / liens AI Office
- Loading dashed pro, switcher Solar/Night/Auto compact, lien agent aligné design system

## Cycle 6 — Pages modules / settings / AI Center / CRM
- Placeholders « Bientôt » sans emojis, code module mono
- Settings : cartes org/thème/profil + options Solar/Night/Auto
- AI Center & CRM alignés tokens globaux (boutons, formulaires)

## Cycle 7 — Modules métier unifiés
- Callouts globaux (`.callout` / `.callout-warning`)
- Accounting, Legal, Marketing, Support, Admin, Notifications : headers `.back-ao`, empty codes, plus de styles inline

## Cycle 8 — Ventes live + polish chrome
- Page Ventes branchée opportunités + leads (plus placeholder)
- Audit aligné design system
- Focus-visible + scrollbars thème ; badge FAB moins « pill »

## Cycle 9 — BI live + chrome AI Office
- Analytics / BI branché sur KPIs dashboard (plus placeholder)
- FAB masqué sur `/app/ai-office` ; chip topbar état « current »

## Cycle 10 — Dashboard nav + Stratégie live
- Accès rapide modules sur Dashboard
- Page BPM / Stratégie : agent STRATEGIE + file d’approbations (plus placeholder)

## Cycle 11 — RH & Stock agent hubs
- HCM et WMS : fiches agent live (RH / STOCK) + CTA AI Office / AI Center
- Placeholders génériques remplacés par hubs professionnels

## Cycle 12 — Agent hub partagé + ERP
- Composant `AgentHubCardComponent` réutilisable
- HCM / WMS refactorés ; Administration = agent ERP + documents

## Cycle 13 — Hubs Marketing / Support / Compta
- Marketing, Support, Comptabilité : agent hub + table métier

## Fix — AI Office 3D + sidebar compacte
- Boot 3D fiable (attente ViewChild + dimensions flex) ; hauteur chaîne shell/content
- Sidebar 188px, paddings resserrés (bordure plus proche des labels)

## Cycle 14 — Hub Juridique
- Page Legal : agent JURIDIQUE + table contrats

## Cycle 15 — Hubs CRM + Ventes
- CRM et Ventes : agent hub + données métier

## Cycle 16 — Hub CMS
- CMS : fiche agent Marketing + callout « bientôt » (plus placeholder générique)

## Cycle 17 — Hubs PIM / SCM + AI Center
- PIM et SCM : hubs agent Stock
- AI Center : hover cartes agents plus net

## Cycle 18 — Hubs MRP / ETL / EDI
- MRP & EDI → agent ERP ; ETL → agent Analytics (pages « bientôt » professionnalisées)

## Cycle 19 — Tokens UI partagés
- Classes globales `.module-code`, `.soon-pill`, `.section-title`
- Pages bientôt allégées (CMS/PIM/SCM/MRP/ETL/EDI)

## Cycle 20 — Night Ops 3D + placeholder
- Éclairage AI Office Night : slate/cyan (plus de violet)
- `ModulePlaceholder` aligné tokens globaux

## Cycle 21 — Solar light + DRY section titles
- Soft window fill SolarPunk
- Suppression styles `.section-title` dupliqués dans modules métier

## Cycle 22 — Titres sections unifiés
- Ventes, BPM, AI Center utilisent `.section-title` global

## Cycle 23 — Bureaux 3D theme-aware
- Bezels/stands desks + cadre CEO : couleurs palette (plus d’indigo fixe)
- Émissifs écrans un peu plus discrets

## Cycle 24 — Avatars + bulles
- Avatars : jambes/yeux slate (plus violet)
- Bulles BD : fond slate-light, typo plus nette

## Cycle 25 — Fin residual violet 3D
- Robe JURIDIQUE slate (plus violet)
- Allée / tapis / zone CEO Night : `#1E293B` / `#0F172A` (plus indigo)
- Logo N : accent slate au lieu de rose

## Cycle 26 — Ambiance 3D + chrome header
- Data streams / fill plafond / murs Night moins émissifs
- Eyebrow AI Office : muted mono (moins « neon accent »)

## Cycle 27 — Dashboard nav plate
- Accès rapide : strip textuel (plus de mini-cartes)

## Cycle 28 — Tokens focus + section-label
- Focus input plus discret
- `.section-label` global (hub / settings / BPM DRY)

## Cycle 29 — Bulle CEO sans violet
- Dialogue comic CEO : accent teal `#5EEAD4` (plus purple)

## Cycle 30 — Cartes plus plates
- `.card` : plus d’ombre douce (bordure seule)

## Builds
- `npm run build` OK
- `./mvnw test` OK (3 tests)
