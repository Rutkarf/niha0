-- Eleven AI desks + rebrand agent codes for OptimusTest

-- Rename / expand agents
UPDATE agents SET code = 'VENTES', name = 'Ventes', domain = 'Ventes',
    description = 'Prospects, opportunités, devis et pipeline',
    mission = 'Convertir les prospects Optimus Test en clients'
WHERE id = 'c0000000-0000-0000-0000-000000000002';

UPDATE agents SET code = 'SUPPORT', name = 'Support', domain = 'Support',
    description = 'Tickets, SLA et satisfaction client',
    mission = 'Résoudre les demandes clients rapidement'
WHERE id = 'c0000000-0000-0000-0000-000000000005';

UPDATE agents SET code = 'ERP', name = 'ERP', domain = 'ERP',
    description = 'Opérations, ressources, achats et processus',
    mission = 'Orchestrer les opérations d''Optimus Test'
WHERE id = 'c0000000-0000-0000-0000-000000000003';

UPDATE agents SET name = 'Comptabilité', domain = 'Comptabilité',
    description = 'Factures, paiements, trésorerie et relances',
    mission = 'Sécuriser la trésorerie'
WHERE id = 'c0000000-0000-0000-0000-000000000004';

UPDATE agents SET name = 'Juridique', domain = 'Juridique',
    description = 'Contrats, conformité et échéances (aide documentaire)',
    mission = 'Anticiper les risques documentaires'
WHERE id = 'c0000000-0000-0000-0000-000000000006';

UPDATE agents SET name = 'Marketing', domain = 'Marketing',
    description = 'Campagnes, CMS, réseaux et performance',
    mission = 'Accroître la visibilité d''Optimus Test'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE agents SET name = 'Direction — Rutkarf Bzz', domain = 'Direction',
    description = 'NIHAO Command Center — validations & KPI',
    mission = 'Piloter Optimus Test et valider les actions IA'
WHERE id = 'c0000000-0000-0000-0000-000000000007';

INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at)
SELECT 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
       'STOCK', 'Stock', 'Stock', 'Inventaire, WMS, mouvements et alertes',
       'Maintenir les niveaux de stock', 'THINKING', NOW()
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = 'c0000000-0000-0000-0000-000000000008');

INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at)
SELECT 'c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001',
       'ANALYTICS', 'Analytics', 'Analytics', 'KPI, BI, rapports et anomalies',
       'Détecter les tendances utiles', 'PREPARING', NOW()
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = 'c0000000-0000-0000-0000-000000000009');

INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at)
SELECT 'c0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001',
       'STRATEGIE', 'Stratégie', 'Stratégie', 'Priorités, risques, OKRs et décisions',
       'Consolider les priorités de la semaine', 'AVAILABLE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = 'c0000000-0000-0000-0000-00000000000a');

INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at)
SELECT 'c0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-000000000001',
       'CRM', 'CRM', 'CRM', 'Clients, contacts, historique et segments',
       'Enrichir la relation client', 'AVAILABLE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = 'c0000000-0000-0000-0000-00000000000b');

INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at)
SELECT 'c0000000-0000-0000-0000-00000000000c', 'a0000000-0000-0000-0000-000000000001',
       'RH', 'RH', 'RH', 'Équipes, rôles, congés et compétences',
       'Accompagner les collaborateurs', 'AVAILABLE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = 'c0000000-0000-0000-0000-00000000000c');

-- Extra pending action for comic dialogue demo (Marketing)
INSERT INTO agent_actions (id, organization_id, agent_id, requested_by, action_type, title, description, draft_payload, workflow_status, agent_status, created_at, updated_at)
SELECT 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
       'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
       'PUBLISH_POST', 'Publication LinkedIn prête',
       'Une publication LinkedIn est prête. Souhaitez-vous la publier ?',
       '{"channel":"LINKEDIN"}', 'DRAFT', 'AVAILABLE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM agent_actions WHERE id = 'd0000000-0000-0000-0000-000000000004');
