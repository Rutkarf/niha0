-- Nom société démo : Optimus Test (espacement lisible)
UPDATE organizations
SET name = 'Optimus Test',
    updated_at = NOW()
WHERE slug = 'optimustest' AND name = 'OptimusTest';

UPDATE agents
SET mission = REPLACE(mission, 'OptimusTest', 'Optimus Test')
WHERE mission LIKE '%OptimusTest%';
