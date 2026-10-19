\connect tidbits_auth

INSERT INTO users (user_id, password_hash, role_id, token_version)
VALUES
    (1, '$2a$10$buF0LW0Y4BMxLdkpWQS2hOwuLvmgrBxoO93fRvpgUdnpRH0rv4Trm', 1, 0),
    (2, '$2a$10$Io3JJ8JOZBY2feSx8Kqv4O3rEr5W1R2DRu5ZGBV/eNLinj8YQpwuS', 1, 0),
    (3, '$2a$10$9H.zAINKP0Ku.qDpPiai0egTTh.6sLwcsUx9Xmtk7SV6WtZNuPuDq', 1, 0),
    (4, '$2a$10$Hud876/C14dauCpz.Ps1L.2v331fo6Era0vnGz7Qo3ruMh/22NVly', 1, 0),
    (5, '$2a$10$t5lscKLYWdKCPYzjwbulFOCKawuR4CYXdbDIuvFcLo3uz6FH9SR0.', 1, 0),
    (6, '$2a$10$jH4q26ZQTuwKPkKiMCG44.8CSQT.ifMw4rxowPh9moYiTd48V58I6', 4, 0)
ON CONFLICT (user_id) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    token_version = EXCLUDED.token_version;
