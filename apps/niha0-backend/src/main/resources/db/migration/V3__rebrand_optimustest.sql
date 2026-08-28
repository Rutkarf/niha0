-- Rebrand demo org to OptimusTest / Owner Rutkarf Bzz

UPDATE organizations
SET name = 'Optimus Test',
    slug = 'optimustest',
    sector = 'Services digitaux & SaaS',
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE organizations
SET name = 'Tenant Isolation Test',
    slug = 'tenant-isolation',
    sector = 'Test',
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE users
SET email = 'rutkarf@optimustest.fr',
    first_name = 'Rutkarf',
    last_name = 'Bzz',
    updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE users
SET email = 'sales@optimustest.fr',
    first_name = 'Léa',
    last_name = 'Moreau',
    updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE users
SET email = 'support@optimustest.fr',
    first_name = 'Noah',
    last_name = 'Petit',
    updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000003';

UPDATE users
SET email = 'ceo@tenant-isolation.fr',
    first_name = 'Alex',
    last_name = 'Rival',
    updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000004';

UPDATE agents SET
    name = CASE code
        WHEN 'MARKETING' THEN 'Marketing de Réseaux'
        WHEN 'COMMERCIAL' THEN 'Commercial'
        WHEN 'ADMINISTRATIF' THEN 'Administratif'
        WHEN 'COMPTABILITE' THEN 'Comptabilité'
        WHEN 'RELATION_CLIENT' THEN 'Relation Client'
        WHEN 'JURIDIQUE' THEN 'Juridique'
        WHEN 'CEO_DIRECTION' THEN 'Direction — Rutkarf Bzz'
        ELSE name
    END,
    description = CASE code
        WHEN 'MARKETING' THEN 'Campagnes, contenus et croissance sociale'
        WHEN 'COMMERCIAL' THEN 'Pipeline, devis et opportunités'
        WHEN 'ADMINISTRATIF' THEN 'Documents, procédures et classement'
        WHEN 'COMPTABILITE' THEN 'Factures, trésorerie et relances'
        WHEN 'RELATION_CLIENT' THEN 'Tickets, satisfaction et réponses'
        WHEN 'JURIDIQUE' THEN 'Contrats et conformité (aide documentaire)'
        WHEN 'CEO_DIRECTION' THEN 'Command Center NIHAO — validations & KPI'
        ELSE description
    END,
    mission = CASE code
        WHEN 'MARKETING' THEN 'Accroître la visibilité d''Optimus Test'
        WHEN 'COMMERCIAL' THEN 'Convertir les leads en clients Optimus Test'
        WHEN 'ADMINISTRATIF' THEN 'Maintenir la conformité administrative'
        WHEN 'COMPTABILITE' THEN 'Optimiser la trésorerie d''Optimus Test'
        WHEN 'RELATION_CLIENT' THEN 'Améliorer la satisfaction client'
        WHEN 'JURIDIQUE' THEN 'Sécuriser les engagements documentaires'
        WHEN 'CEO_DIRECTION' THEN 'Piloter Optimus Test et valider les actions IA'
        ELSE mission
    END
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE agent_actions
SET title = 'Relance facture FAC-2026-014',
    description = 'Validation requise : relance client Maison Dupont'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

UPDATE notifications
SET title = 'Validation requise',
    message = 'L''agent Comptabilité attend devant le bureau de Rutkarf Bzz'
WHERE id = 'a2000000-0000-0000-0000-000000000001';
