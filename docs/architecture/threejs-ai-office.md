# AI Office Three.js — disposition actuelle

## Layout (salle agrandie, rien n’est retiré)

```text
Gauche haut     : CEO Command Center (FIXE, x ≈ -10)
Gauche milieu   : bibliothèques données (FIXE, z ≈ -7.1)
Gauche bas      : 3 assistants CEO (Protocole, Cabinet, Conseil)
Centre          : bande claire + 2 centralisateurs
Droite          : 11 bureaux existants en 2 rangées (7 + 4)
Droite haut     : mezzanine verre + 3 assistants IA (Runtime, Studio, Gouvernance)
Sous mezzanine  : escalier invisible (collision, interdit aux marcheurs)
Toute la pièce  : 7 animaux totem (aigle, loup, renard, tigre, hibou, dragon, papillon)
```

CEO et bibliothèques conservent leurs positions d’origine. La pièce est élargie
(≈ 34 × 23, murs plus hauts) pour accueillir la mezzanine, le staff CEO et les totems.

## Pôles (11 bureaux, inchangés en identité)

| Pôle | Agents |
|------|--------|
| Clients | CRM, Ventes, Support, Marketing |
| Gestion | ERP, Comptabilité, RH, Juridique |
| Ops | Stock, Analytics, Stratégie |

## Modules Three.js

- `scene-manager.ts` — caméra, walk, `focusAgent`, bulles, LEDs, totems
- `layout.ts` — positions salle / bureaux / mezzanine / totems
- `mezzanine.factory.ts` — plateforme verre + escalier invisible
- `totem.factory.ts` — 7 animaux ethérés
- `led.factory.ts` — LEDs rouge/verte au clic
- `ui/speech-bubble.factory.ts` — bulles tâches
- `ui/comic-dialogue.factory.ts` — dialogue agent ↔ CEO
- `theme-palette.ts` — SolarPunk vert / Cyberpunk synthwave / or CEO

## Navigation

- `/app/ai-office?agent=accounting` focus Comptabilité
- Touche `O`, FAB, chip header, lien sidebar prioritaire
- Clic assistant → LEDs rouge/verte s’allument
