# ADR 004 — ERP data libraries (CMS / PIM / SCM / MRP / ETL / EDI)

## Status
Superseded in part — **PIM + CMS/SCM/MRP/ETL/EDI are REAL** as of 0.7.0

## Context
Early MVP kept non-core ERP surfaces as agent hubs (“Bientôt”) while CRM/stock/etc. were wired.

## Decision (0.7)
- Shared table `erp_items` + API `/erp/{module}/items` for CMS, SCM, MRP, ETL, EDI
- Permission `erp.write` for mutations
- FE CRUD page `ErpCrudPage` + Gestion / Données nav without `soon`
- PIM remains dedicated product/variant model

## Consequences
- Shell pages replaced by operational CRUD
- AI Office libraries marked `available`
- Further domain depth (BOMs, ASN, mapping UI) can evolve without another shell→REAL rewrite
