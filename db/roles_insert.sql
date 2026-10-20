\connect tidbits_auth

INSERT INTO roles (role_id, name) VALUES (1, 'client')
ON CONFLICT (role_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (role_id, name) VALUES (2, 'auditor')
ON CONFLICT (role_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (role_id, name) VALUES (3, 'reporter')
ON CONFLICT (role_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (role_id, name) VALUES (4, 'admin')
ON CONFLICT (role_id) DO UPDATE SET name = EXCLUDED.name;

-- Keep SERIAL sequence aligned with explicit IDs inserted above.
SELECT setval('roles_role_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM roles), true);