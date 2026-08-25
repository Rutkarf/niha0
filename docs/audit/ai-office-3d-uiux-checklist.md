# Checklist UI/UX — AI Office 3D (Tâches 2–50)

> **Date :** 2026-08-25  
> **Statut :** implémenté + `npm run lint` / `npm run test` OK (17 tests)  
> **Réf. audit :** [ai-office-3d-uiux-audit.md](./ai-office-3d-uiux-audit.md)

| # | Statut | Note |
|---|--------|------|
| 2 | ✅ | Framing `Box3` + padding 1.2, FOV mobile, polar limits, biais lookAt — `camera-framing.ts` + specs |
| 3 | ✅ | Damping 0.075, lerp caméra soft, transitions focus agent/lib/CEO |
| 4 | ✅ | Hover rings / libs / CEO emissive / curseur pointer |
| 5 | ✅ | `pulseObjectClick` sur desk, avatar, lib, bell, CEO |
| 6 | ✅ | Tooltips HTML NDC + `onTooltip` (agent, lib, CEO, sonnette) |
| 7 | ✅ | Hiérarchie : focusCeo, chip validations, anneaux status boost |
| 8 | ✅ | Palettes Solar / Night / Cyberpunk boost / Corporate |
| 9 | ✅ | Lights + spots accent CEO / desks, fog jour/nuit |
| 10 | ✅ | Ombres PCF adaptatives (off mobile / DPR élevé), glass metalness |
| 11 | ✅ | Respiration / sway avatars + marche pathfinding |
| 12 | ✅ | Teintes status (`STATUS_TINT` + rings) |
| 13 | ✅ | Porte vitrée animée (open / pending / reviewing) |
| 14 | ✅ | Sonnette press / ringing / hover + tooltip |
| 15 | ✅ | Toast + focusCeo quand pending ↑ |
| 16 | ✅ | Panneau agent (initiales, badge, mission, module, dialog a11y) |
| 17 | ✅ | Panneau CEO (comic, actions, empty, search/sort/page) |
| 18 | ✅ | Bibliothèques silhouettes distinctes + panneau Bientôt |
| 19 | ✅ | Logo mural + tapis branding (`ceoOptions`) |
| 20 | ✅ | Presets Solar/Night/Cyberpunk/Corporate/Auto persistés |
| 21 | ✅ | Responsive 900/640 px header + canvas + hints |
| 22 | ✅ | Clavier agents/libs/CEO/bell + Entrée |
| 23 | ✅ | `prefers-reduced-motion` live (MQ listener + CSS) |
| 24 | ✅ | Dispose géométries/matériaux/listeners/timers ; shadows adaptatives |
| 25 | ✅ | LoadingState + message long après 2,5 s |
| 26 | ✅ | Erreur agents + Réessayer |
| 27 | ✅ | Onboarding 4 étapes (`niha0_office_onboarded`) |
| 28 | ✅ | Focus caméra sur événements validation |
| 29 | ✅ | Indicateurs activité (rings + markers approval) |
| 30 | ✅ | Toasts warning validation prioritaire |
| 31 | ✅ | Micro-interactions boutons / chip / theme |
| 32 | ✅ | Icônes theme (☀☾⚡▣◐) cohérentes |
| 33 | ✅ | Typo / contrast panels & header |
| 34 | ✅ | Spacing compact header, panels aérés |
| 35 | ✅ | Empty CEO / filtre sans résultat |
| 36 | ✅ | Transition panneau slide (réduite si reduced-motion) |
| 37 | ✅ | Scroll panels `overflow-y: auto` |
| 38 | ✅ | Toasts succès approve/reject |
| 39 | ✅ | Fallback WebGL + Réessayer |
| 40 | ✅ | Preview live thème (rebuild scène) + Annuler via re-pick |
| 41 | ✅ | États `.btn` hover/focus/active/disabled/loading |
| 42 | ✅ | Input search validations labelé |
| 43 | ✅ | Eyebrow breadcrumb `AI Office / Command Center` |
| 44 | ✅ | Filtre recherche panneau CEO |
| 45 | ✅ | Tri titres `localeCompare('fr')` |
| 46 | ✅ | Pagination « Afficher plus » (5) |
| 47 | ✅ | Modales dialog aria-modal + Escape + focus restore |
| 48 | ✅ | Stack toasts bas-droite 3,5 s `aria-live` |
| 49 | ✅ | Revue checklist (ce fichier) |
| 50 | ✅ | Lint + 17 tests unitaires verts |

## Commandes de validation

```bash
cd apps/niha0-frontend
npm run lint   # tsc --noEmit OK
npm run test   # 8 files / 17 tests passed
```

## Fichiers clés

- `ai-office.page.ts` — shell UX, panneaux, onboarding, toasts, tooltips
- `theme-switcher.component.ts` — 5 presets
- `three/scene-manager.ts` — interactions 3D
- `three/camera-framing.ts` — cadrage salle
- `three/office-builder.ts` — lumière / ambiance
- `three/library.factory.ts` — libs distinctes
- `three/scene-presets.ts` — persistence presets
- `docs/audit/ai-office-3d-uiux-checklist.md` — cette checklist
