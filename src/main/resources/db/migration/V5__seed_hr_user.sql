-- Sprint 1: ещё один HR-аккаунт.
-- Пароль захэширован (BCrypt), в открытом виде нигде не хранится.
-- Если пользователь с таким email уже существует — пропускаем (ON CONFLICT DO NOTHING).

INSERT INTO users (
    assembly_id, first_name, last_name, middle_name,
    email, phone, status, role, is_active,
    password_hash, password_set_at
)
VALUES
    -- user@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed11',
        'Тест', 'Пользователь', 'Seed4',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    )
ON CONFLICT (email) DO NOTHING;
