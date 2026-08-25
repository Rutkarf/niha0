-- Demo seed data for Nova Atelier

-- Organizations
INSERT INTO organizations (id, name, slug, sector, created_at, updated_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Nova Atelier', 'nova-atelier', 'Mode & Design', NOW(), NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'Rival Studio', 'rival-studio', 'Mode', NOW(), NOW());

-- Users (password: Demo2026!)
INSERT INTO users (id, email, password_hash, first_name, last_name, active, created_at, updated_at) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'ceo@nova-atelier.fr', '$2b$10$aUlcFdOuqPyyxHrcgakh9u.rW2sCPmXCBv6boRR0eEbK20OU95qOm', 'Camille', 'Bernard', TRUE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000002', 'sales@nova-atelier.fr', '$2b$10$aUlcFdOuqPyyxHrcgakh9u.rW2sCPmXCBv6boRR0eEbK20OU95qOm', 'Lucas', 'Martin', TRUE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000003', 'support@nova-atelier.fr', '$2b$10$aUlcFdOuqPyyxHrcgakh9u.rW2sCPmXCBv6boRR0eEbK20OU95qOm', 'Emma', 'Dupont', TRUE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000004', 'ceo@rival-studio.fr', '$2b$10$aUlcFdOuqPyyxHrcgakh9u.rW2sCPmXCBv6boRR0eEbK20OU95qOm', 'Alex', 'Rival', TRUE, NOW(), NOW());

-- Memberships
INSERT INTO memberships (id, organization_id, user_id, role, active, created_at) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'OWNER', TRUE, NOW()),
    ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'SALES', TRUE, NOW()),
    ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'SUPPORT', TRUE, NOW()),
    ('a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'OWNER', TRUE, NOW());

-- Customers
INSERT INTO customers (id, organization_id, name, email, phone, industry, status, created_at, updated_at) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Maison Dupont', 'contact@maison-dupont.fr', '+33 1 23 45 67 89', 'Luxe', 'ACTIVE', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Boutique Lumière', 'hello@boutique-lumiere.fr', '+33 1 98 76 54 32', 'Retail', 'ACTIVE', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Client Rival Secret', 'secret@rival.fr', NULL, 'Retail', 'ACTIVE', NOW(), NOW());

-- Leads
INSERT INTO leads (id, organization_id, company_name, contact_name, email, source, status, score, created_at, updated_at) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Atelier Nord', 'Marie Curie', 'marie@atelier-nord.fr', 'Salon professionnel', 'QUALIFIED', 75, NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Studio Vert', 'Paul Green', 'paul@studio-vert.com', 'Site web', 'NEW', 40, NOW(), NOW());

-- Opportunities
INSERT INTO opportunities (id, organization_id, customer_id, title, stage, amount, probability, expected_close, created_at, updated_at) VALUES
    ('a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Collection automne Maison Dupont', 'PROPOSAL', 18500.00, 60, '2026-03-15', NOW(), NOW()),
    ('a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Renouvellement contrat Boutique Lumière', 'NEGOTIATION', 9200.00, 80, '2026-02-28', NOW(), NOW());

-- Invoices
INSERT INTO invoices (id, organization_id, customer_id, reference, status, total_amount, paid_amount, due_date, issued_at, created_at) VALUES
    ('a4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'FAC-2026-014', 'SENT', 4200.00, 0.00, '2026-02-10', '2026-01-25', NOW()),
    ('a4000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'FAC-2026-008', 'PAID', 3100.00, 3100.00, '2026-01-15', '2026-01-01', NOW());

-- Tickets
INSERT INTO tickets (id, organization_id, customer_id, subject, description, status, priority, created_at, updated_at) VALUES
    ('a5000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Livraison retardée', 'Colis non reçu depuis 5 jours', 'OPEN', 'HIGH', NOW(), NOW()),
    ('a5000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Question facturation', 'Demande de détail sur FAC-2026-008', 'RESOLVED', 'LOW', NOW(), NOW());

-- Agents (7 domain agents)
INSERT INTO agents (id, organization_id, code, name, domain, description, mission, status, created_at) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MARKETING', 'Agent Marketing', 'Marketing', 'Campagnes et contenus', 'Accroître la visibilité de Nova Atelier', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'COMMERCIAL', 'Agent Commercial', 'Commercial', 'Pipeline et ventes', 'Convertir les leads en clients', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ADMINISTRATIF', 'Agent Administratif', 'Administration', 'Documents administratifs', 'Maintenir la conformité administrative', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'COMPTABILITE', 'Agent Comptabilité', 'Comptabilité', 'Facturation et relances', 'Optimiser la trésorerie', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'RELATION_CLIENT', 'Agent Relation Client', 'Relation Client', 'Support et satisfaction', 'Améliorer la satisfaction client', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'JURIDIQUE', 'Agent Juridique', 'Juridique', 'Contrats et conformité', 'Sécuriser les engagements légaux', 'AVAILABLE', NOW()),
    ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'CEO_DIRECTION', 'Agent Direction CEO', 'Direction', 'Pilotage stratégique', 'Synthétiser les KPIs pour la direction', 'AVAILABLE', NOW());

-- Agent actions (3+, at least 1 WAITING_APPROVAL)
INSERT INTO agent_actions (id, organization_id, agent_id, requested_by, action_type, title, description, draft_payload, workflow_status, agent_status, created_at, updated_at) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'SEND_PAYMENT_REMINDER', 'Relance facture FAC-2026-014', 'Facture impayée depuis 15 jours', '{"invoiceRef":"FAC-2026-014"}', 'REQUEST_APPROVAL', 'WAITING_APPROVAL', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'FOLLOW_UP_OPPORTUNITY', 'Relancer opportunité Maison Dupont', 'Devis en attente', '{"opportunityRef":"OPP-001"}', 'APPROVED', 'AVAILABLE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREATE_CAMPAIGN', 'Campagne printemps', 'Email + réseaux sociaux', '{"channel":"EMAIL"}', 'COMPLETED', 'AVAILABLE', NOW(), NOW());

-- Update agent waiting approval status
UPDATE agents SET status = 'WAITING_APPROVAL' WHERE id = 'c0000000-0000-0000-0000-000000000004';

-- Notifications
INSERT INTO notifications (id, organization_id, user_id, title, message, type, read, created_at) VALUES
    ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Approbation requise', 'Relance facture FAC-2026-014 en attente de validation', 'APPROVAL', FALSE, NOW());
