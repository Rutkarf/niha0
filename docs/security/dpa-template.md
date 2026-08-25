# Modèle de DPA (Data Processing Agreement) — NIHAO

> Modèle **non juridique**. À faire relire et adapter par un avocat avant signature avec un client B2B UE.

## Parties

- **Responsable de traitement** : le client (organisation utilisatrice de NIHAO)
- **Sous-traitant** : l’éditeur NIHAO (SASURD / opérateur du SaaS)

## Objet

Traitement des données personnelles des utilisateurs et des contacts métier hébergés dans NIHAO (CRM, tickets, RH, documents) pour la fourniture du service SaaS.

## Durée

Durée du contrat d’abonnement + période de rétention documentée après résiliation (export puis effacement).

## Nature & finalité

Hébergement, authentification, notifications, recherche documentaire (RAG), facturation, support.

## Types de données

Identité (nom, email), données métier saisies par le client, logs d’audit, documents uploadés.

## Obligations du sous-traitant

1. Traiter uniquement sur instruction documentée du responsable
2. Confidentialité du personnel
3. Mesures de sécurité (chiffrement en transit, isolation multi-tenant, sauvegardes)
4. Assistance RGPD (export / erase via `/api/privacy/*`)
5. Notification de violation dans les délais légaux
6. Suppression ou restitution des données en fin de contrat

## Sous-traitants ultérieurs

Hébergeur cloud UE, stockage objet, fournisseur e-mail transactionnel, provider LLM (si activé) — liste tenue à jour dans les mentions légales.

## Transferts hors UE

Interdits sauf mécanisme de conformité (SCC) et information préalable du client.

## Contact

privacy@nihao.app
