# AI Office Three.js — disposition actuelle

## Layout

```text
Gauche  : CEO Command Center (Rutkarf Bzz / OptimusTest)  x ≈ -10
Centre  : circulation + zone d'attente validation
Droite  : 11 bureaux IA
```

### Pôles

| Pôle | Agents |
|------|--------|
| Clients | CRM, Ventes, Support, Marketing |
| Gestion | ERP, Comptabilité, RH, Juridique |
| Ops | Stock, Analytics, Stratégie |

## Modules Three.js

- `scene-manager.ts` — caméra, walk, `focusAgent`, bulles
- `ui/speech-bubble.factory.ts` — bulles tâches
- `ui/comic-dialogue.factory.ts` — dialogue agent ↔ CEO
- `theme-palette.ts` — SolarPunk vert / Cyberpunk synthwave

## Navigation

- `/app/ai-office?agent=accounting` focus Comptabilité
- Touche `O`, FAB, chip header, lien sidebar prioritaire
