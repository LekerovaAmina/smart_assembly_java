-- Sprint 1: доп. тестовые аккаунты — ещё один HR, 3 волонтёра-болванки, 2 супер-админа.
-- Пароли захэшированы (BCrypt), в открытом виде нигде не хранятся.
-- Если пользователь с таким email уже существует — пропускаем (ON CONFLICT DO NOTHING).

INSERT INTO users (
    assembly_id, first_name, last_name, middle_name,
    email, phone, status, role, is_active,
    password_hash, password_set_at
)
VALUES
    -- HR
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed9',
        'Тест', 'Пользователь', 'Seed4',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),

    -- Волонтёры-болванки для теста (пароли ниже, реальным людям не принадлежат)
    -- test.volunteer1@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Первый',
        'Тест', 'Пользователь', 'Seed1',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),
    -- test.volunteer2@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Второй',
        'Тест', 'Пользователь', 'Seed2',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),
    -- test.volunteer3@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Третий',
        'Тест', 'Пользователь', 'Seed3',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),

    -- Супер-админы
    -- user@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed8',
        'Тест', 'Пользователь', 'Seed5',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    ),
    -- user@example.com / <redacted>
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Пользователь', 'Seed6',
        'Тест', 'Пользователь', 'Seed5',
        '$2a$10$REDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDACTEDREDAC', now()
    )
ON CONFLICT (email) DO NOTHING;
