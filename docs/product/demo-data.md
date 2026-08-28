# Données de démonstration NIHAO

## Organisation

| Champ | Valeur |
|-------|--------|
| Nom | **Optimus Test** |
| Slug | `optimustest` |
| Secteur | Services digitaux & SaaS |

## Owner

| Champ | Valeur |
|-------|--------|
| Nom | **Rutkarf Bzz** |
| Email | `rutkarf@optimustest.fr` |
| Mot de passe | `Demo2026!` |
| Rôle | `OWNER` |

## Autres utilisateurs

| Email | Rôle |
|-------|------|
| `sales@optimustest.fr` | SALES |
| `support@optimustest.fr` | SUPPORT |

## Tenant d’isolation (tests)

- Organisation `Tenant Isolation Test` (`tenant-isolation`)
- User `ceo@tenant-isolation.fr`

## Contenu seedé

- Clients, leads, opportunités
- Factures (dont FAC-2026-014 impayée)
- Tickets support
- 6 agents métier + Direction CEO
- 3 actions IA dont **1 en attente** (agent Comptabilité → relance facture)
- Notification + audit prêt côté workflow

Migrations : `V1__schema.sql`, `V2__seed.sql`, `V3__rebrand_optimustest.sql`
