-- Keep H2 test seed aligned with OptimusTest branding for fresh test runs
UPDATE organizations SET name = 'Optimus Test', slug = 'optimustest', sector = 'Services digitaux & SaaS' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE organizations SET name = 'Tenant Isolation Test', slug = 'tenant-isolation' WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE users SET email = 'rutkarf@optimustest.fr', first_name = 'Rutkarf', last_name = 'Bzz' WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE users SET email = 'sales@optimustest.fr' WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE users SET email = 'support@optimustest.fr' WHERE id = 'b0000000-0000-0000-0000-000000000003';
UPDATE users SET email = 'ceo@tenant-isolation.fr' WHERE id = 'b0000000-0000-0000-0000-000000000004';
