-- Sprint 1: тестовые HR-аккаунты для проверки входа по email+паролю.
-- Пароли захэшированы (BCrypt), в открытом виде нигде не хранятся.
-- Если пользователь с таким email уже существует — пропускаем (ON CONFLICT DO NOTHING).

INSERT INTO users (
    assembly_id, first_name, last_name, middle_name,
    email, phone, status, role, is_active,
    password_hash, password_set_at
)
VALUES
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed7',
        'Тест', 'Пользователь', 'Seed4',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed10',
        'Тест', 'Пользователь', 'Seed4',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed9',
        'Тест', 'Пользователь', 'Seed4',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),

ON CONFLICT (email) DO NOTHING;
