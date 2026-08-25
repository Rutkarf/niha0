# Audit UI/UX — AI Office 3D (Tâche 1)

> **Date :** 2026-08-25  
> **Périmètre :** `apps/niha0-frontend` — feature `ai-office` + scène Three.js uniquement  
> **Hors périmètre :** backend, API, modèles, migrations, logique métier  
> **Stack vérifiée :** Angular 21 standalone / signals · Three.js 0.185 · OrbitControls

---

## 1. Résumé exécutif

L’AI Office 3D est un **command center immersif** déjà fonctionnel : salle CEO + open-space 11 agents, OrbitControls amortis, framing `Box3`, focus rings, porte/sonnette CEO, bulles BD, thèmes Solar/Night, panneaux latéraux, navigation clavier partielle, fallback 2D WebGL.

**Verdict UX :** expérience **prometteuse mais inégale**. La scène se lit bien en Night (grille cyan, anneaux colorés), mais plusieurs frictions freinent une utilisation professionnelle fluide : onboarding absent, tooltips 3D manquants, panneaux agent/CEO moins soignés que le panneau bibliothèque, CEO hors cycle clavier, Escape absent, états d’erreur silencieux, header dense qui réduit le viewport, feedback clic/sonnette/hover non uniformes.

| Indicateur | État |
|------------|------|
| Maturité visuelle 3D | Bonne base (palette, lights, rings, glass CEO) |
| Clarté des interactions | Moyenne — hover bureau OK, CEO/bell/libs moins explicites |
| Accessibilité | Partielle — flèches/Entrée OK ; CEO, Escape, focus trap, live regions incomplets |
| Responsive | Fragile — header wrap + canvas flex ; mobile non optimisé |
| Performance | Acceptable — rebuild thème coûteux ; ombres 1024 toujours on |
| Cohérence UI shell ↔ 3D | Moyenne — notifications shell non synchronisées caméra |

---

## 2. Cartographie frontend AI Office

```text
features/ai-office/
├── ai-office.page.ts              # Shell page : header, canvas, panneaux, boot WebGL
├── components/
│   └── theme-switcher.component.ts
└── three/
    ├── scene-manager.ts           # Orchestration rendu, input, caméra, agents
    ├── camera-framing.ts          # Box3 + padding + limites orbit
    ├── office-builder.ts          # Sol, murs, lumières, grille, plantes
    ├── desk.factory.ts            # Bureaux agents + bureau CEO
    ├── avatar.factory.ts          # Avatars cartoon + accessoires
    ├── ceo-avatar.factory.ts
    ├── ceo-door.factory.ts         # Porte vitrée + sonnette
    ├── branding.factory.ts        # Logo mural + tapis entreprise
    ├── library.factory.ts         # Bibliothèques « bientôt »
    ├── focus-ring.factory.ts      # Anneaux sol hover/selected
    ├── theme-palette.ts           # SOLARPUNK / CYBERPUNK
    ├── pathfinding.ts             # Trajets agents → porte CEO
    ├── navigation.types.ts
    ├── types.ts
    └── ui/
        ├── speech-bubble.factory.ts
        └── comic-dialogue.factory.ts
```

**Dépendances UI hors feature (lues, non modifiées métier) :**

| Module | Rôle UX |
|--------|---------|
| `ThemeService` | Solar / Night / Auto → rebuild scène |
| `CeoApprovalService` | États porte / cloche / CEO → sync 3D |
| `approval-notifications.component` | Cloche shell (11 agents) — lien faible avec focus 3D |
| `ProfessionalWorkspaceService` | Nom entreprise, branding, logo |
| `WorkspaceSelectionService` | Sélection agent / lib / CEO |
| `agent-accents` | Couleurs par code agent |
| `StatusBadgeComponent` / `LoadingStateComponent` | États UI 2D |

**Flux utilisateur principal :**

1. Chargement agents API → `loading` → boot WebGL (ou fallback 2D).
2. Framing salle entière → orbit / zoom / pan.
3. Survol anneau → clic bureau → focus caméra + panneau agent.
4. Agent `WAITING_APPROVAL` → marche vers porte → sonnette → panneau CEO.
5. Bibliothèques mur → panneau « Bientôt ».
6. Theme switcher → rebuild graph 3D.

---

## 3. Forces actuelles (à préserver)

1. **Framing caméra** via `computeRoomBounds` + `CAMERA_ROOM_PADDING` (1.18) — salle entière visible au load.
2. **OrbitControls** officiel avec damping (`0.08`), polar clamp, pan/zoom.
3. **Focus rings** idle/hover/selected lisibles, hit volume généreux.
4. **`prefers-reduced-motion`** lu à l’init (micro-mouvements / fades réduits).
5. **Dispose** scène : géométries, matériaux sprites, controls, listeners, ResizeObserver.
6. **Fallback 2D** si WebGL / host 0×0 — résilience Firefox/GPU.
7. **Palette duale** Solar / Night cohérente avec tokens CSS shell.
8. **Pathfinding + porte** : narration visuelle validation CEO crédible.
9. **Branding** logo + tapis avec fallback initiales.
10. **Hint contrôles** présent sous le canvas (FR).

---

## 4. Points de friction & bugs visuels

### 4.1 Scène 3D

| ID | Problème | Impact UX |
|----|----------|-----------|
| S01 | Pas de tooltip / label 3D au survol (agent, lib, bell, porte) | Découverte lente ; dépend du hint bas de page |
| S02 | Feedback clic (pression / pulse) absent sur desks / libs | Clic peu confirmé hors panneau |
| S03 | Hover CEO / sonnette : curseur pointer OK, mais peu de highlight géométrie | Sonnette peu découvrable |
| S04 | États agent (AVAILABLE / THINKING / WAITING) surtout via statut API + anneau couleur fixe (accent code) | Confusion état métier vs couleur métier |
| S05 | Bulles BD multiples peuvent se chevaucher / polluer | Charge cognitive, surtout mode « Bulles BD » on |
| S06 | Bibliothèques visuellement similaires (même forme) | Différenciation faible malgré accents |
| S07 | Rebuild complet scène au changement de thème | Flash / micro-freeze possible |
| S08 | Ombres PCF 1024 toujours actives | Perf mobile / Firefox intégrés |
| S09 | Grille synthwave = nombreux meshes Box | Draw calls élevés Night |
| S10 | Labels porte/desk = barres abstraites (pas de vrai texte 3D lisible) | Identification agent à distance difficile |
| S11 | CEO exclu de `focusableTargets()` clavier | Navigation a11y incomplète |
| S12 | `reducedMotion` non réactif (pas de listener `change`) | Préférence OS ignorée en session |
| S13 | Focus caméra notification shell → objet 3D non branché depuis AI Office | Sync UI/3D incomplète |
| S14 | Animation porte/bell présentes mais peu de feedback d’état textuel | État « ringing / open » opaque sans panneau |

### 4.2 UI page (DOM)

| ID | Problème | Impact UX |
|----|----------|-----------|
| U01 | Header dense (eyebrow + h1 + sub + actions) réduit hauteur canvas | Viewport 3D trop petit sur laptop / zoom |
| U02 | `role="img"` sur host vs `role="application"` sur canvas | Sémantique ARIA conflictuelle |
| U03 | Panneau agent : close sans `aria-label`, pas de `role="dialog"` / `aria-modal` | Incohérent vs panneau bibliothèque |
| U04 | Panneau CEO : idem + 4 boutons denses sans hiérarchie visuelle forte | Workflow validation moins clair |
| U05 | Pas de fermeture Escape sur panneaux | Attendu standard modale |
| U06 | Pas de focus trap / restauration focus | Clavier sort dans la page derrière |
| U07 | Erreur `getAgents` → `loading=false` sans message | Écran vide silencieux |
| U08 | Fallback 2D : badge « Mode 2D » sans explication / CTA retry | Utilisateur perdu |
| U09 | Toggle « Bulles BD » sans description accessible | Label court, pas d’aide |
| U10 | Hint 0.65rem, non lié via `aria-describedby` | Ignoré / non accessible |
| U11 | Pas d’onboarding (première visite) | Courbe d’apprentissage élevée |
| U12 | Theme switcher : Solar / Night / Auto seulement (pas Corporate dédié) | Écart vs roadmap thèmes |
| U13 | Micro-interactions boutons header limitées | Look « outil » plutôt que produit soigné |
| U14 | États vides CEO (« aucune validation ») OK en comic ; listes agent sans empty dédié | Inégal |
| U15 | Chip « N validation(s) » ouvre CEO mais ne focus pas la porte 3D | Sync UI/3D |

### 4.3 Responsive & perf

| ID | Problème | Impact |
|----|----------|--------|
| R01 | Pas de breakpoint dédié (contrôles tactiles, hint, panneaux plein écran) | Mobile / tablette difficiles |
| R02 | Orbit + raycast touch : `touch-action: none` OK, mais pan/orbit sans affordance | Gestes non expliqués |
| R03 | `setPixelRatio(min(dpr, 2))` + shadows : risque &lt;60 FPS sur GPU faibles | Fluidité |
| R04 | Resize → re-framing si pas de focus : peut surprendre pendant orbit manuel | Caméra « saute » |

### 4.4 Accessibilité (synthèse)

| Critère | Statut |
|---------|--------|
| Navigation flèches / Entrée agents+libs | OK |
| Focus CEO / bell clavier | Manquant |
| Escape panneaux | Manquant |
| Focus visible canvas | Partiel (tabIndex 0, outline non stylé host) |
| Labels ARIA panneaux | Incomplets (agent / CEO) |
| Contraste Night | Globalement OK ; Solar bulles claires OK |
| Reduced motion | Partiel (init only) |
| Annonces live (sonnette / arrivée agent) | Comic box CEO seulement ; scène muette |

---

## 5. Zones confuses pour un nouvel utilisateur

1. **Que cliquer en premier ?** — Aucun highlight guidé ; 11 anneaux + CEO + libs compétitionnent.
2. **Sonnette** — Petite géométrie ; pas de label « Sonner / Ouvrir validations ».
3. **Bibliothèques** — Ressemblent à des casiers ; panneau « Bientôt » peut frustrer.
4. **Bulles BD** — Activées par défaut ; bruit visuel avant compréhension.
5. **Mode Demo (mock)** — Mention moteur IA en sous-titre ; pas d’impact scénique clair.
6. **Mode 2D** — Apparition sans diagnostic (WebGL ? taille host ?).

---

## 6. Problèmes prioritaires (backlog Tâches 2–50)

### P0 — Bloquants UX / a11y

| # | Problème | Tâche(s) cible |
|---|----------|----------------|
| P0-1 | Framing / damping / limites caméra à stabiliser et documenter UX | 2, 3 |
| P0-2 | Feedback hover + clic unifiés sur tous les interactifs 3D | 4, 5 |
| P0-3 | Navigation clavier CEO/bell + Escape + ARIA panneaux | 22, 47 |
| P0-4 | `prefers-reduced-motion` live + réduction cohérente | 23 |
| P0-5 | Dispose / perf / pas de leaks (baseline FPS) | 24 |
| P0-6 | Erreurs / loading / fallback explicites | 25, 26, 39 |

### P1 — Expérience immersive

| # | Problème | Tâche(s) |
|---|----------|----------|
| P1-1 | Tooltips / labels 3D | 6 |
| P1-2 | Hiérarchie visuelle CEO / agents actifs | 7 |
| P1-3 | Couleurs / matériaux / light / ombres | 8, 9, 10 |
| P1-4 | Animations agents + états visuels | 11, 12, 29 |
| P1-5 | Porte / sonnette / sync notifications | 13, 14, 15, 28, 30 |
| P1-6 | Panneaux agent / CEO / libs | 16, 17, 18 |
| P1-7 | Branding logo / tapis | 19 |
| P1-8 | Onboarding | 27 |

### P2 — Polish produit

| # | Problème | Tâche(s) |
|---|----------|----------|
| P2-1 | Thèmes + preview + persistance | 20, 40 |
| P2-2 | Responsive scène | 21 |
| P2-3 | Micro-interactions, icônes, typo, spacing | 31–34 |
| P2-4 | Empty states, transitions, scroll, toasts | 35–38, 48 |
| P2-5 | Boutons / formulaires cohérents | 41, 42 |

### P3 — Organisation & validation

| # | Problème | Tâche(s) |
|---|----------|----------|
| P3-1 | Breadcrumbs / search / sort / pagination listes | 43–46 |
| P3-2 | Tests utilisateurs + checklist finale | 49, 50 |

---

## 7. Matrice fichier → axes d’amélioration

| Fichier | Axes UI/UX |
|---------|------------|
| `ai-office.page.ts` | Header, a11y panneaux, Escape, loading/error, onboarding, toasts, sync focus |
| `theme-switcher.component.ts` | Thèmes étendus, preview, icônes cohérentes |
| `scene-manager.ts` | Caméra, hover/clic, tooltips hook, keyboard CEO, perf loop, reduced-motion listener |
| `camera-framing.ts` | Marge, FOV mobile, limites |
| `office-builder.ts` | Light, fog, grid perf, hiérarchie |
| `focus-ring.factory.ts` | États métier, pulse clic |
| `ceo-door.factory.ts` | Porte, bell, tooltip |
| `library.factory.ts` | Identité visuelle par lib |
| `avatar.factory.ts` / `ceo-avatar.factory.ts` | Respiration, regard, états |
| `branding.factory.ts` | Logo ratio, tapis lisibilité |
| `speech-bubble` / `comic-dialogue` | Densité, lisibilité, reduced-motion |
| `theme-palette.ts` | Cohérence matériaux |

---

## 8. Critères de succès globaux (post T50)

- [ ] Salle entière cadrée au load, contrôles fluides (damping).
- [ ] Tout objet interactif a hover + clic + tooltip/label clair.
- [ ] Clavier : agents, libs, CEO/bell ; Escape ferme ; focus visible.
- [ ] Reduced-motion respecté dynamiquement.
- [ ] Panneaux agent/CEO/lib accessibles et cohérents.
- [ ] Notifications shell ↔ focus 3D.
- [ ] Loading / error / empty / fallback explicites.
- [ ] Thèmes persistants avec preview.
- [ ] Utilisable tablette ; desktop 60 FPS cible Night.
- [ ] Aucune régression Firefox ; dispose propre.

---

## 9. Risques d’implémentation (roadmap 2–50)

| Risque | Mitigation |
|--------|------------|
| Rebuild thème trop fréquent | Diff appearance ; mutualiser géométries |
| Tooltips DOM vs sprites 3D | Préférer overlay HTML ancré (a11y + Firefox) |
| Trop d’animations | Gate `reducedMotion` + budget FPS |
| Coupler UI notifications ↔ scène | Callbacks existants `focusAgent` / `openCeoPanel` |
| Scope creep backend | Strict : UI/UX only |

---

## 10. Diagnostic court (Tâche 1)

L’AI Office a déjà les **fondations techniques et visuelles** d’un produit sérieux (caméra, rings, CEO door, approvals, branding). Les écarts UX majeurs sont **découvrabilité** (tooltips, onboarding, sonnette), **accessibilité des panneaux et du CEO**, **feedback d’interaction**, **gestion d’erreur/loading**, et **synchronisation shell ↔ 3D**. Les tâches 2–50 adressent ces écarts sans toucher aux contrats API.

**Livrable Tâche 1 :** ce rapport + liste priorisée ci-dessus. Aucune modification runtime requise pour clôturer l’audit ; les correctifs commencent à la Tâche 2 (cadrage caméra).
`)