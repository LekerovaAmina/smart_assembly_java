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
        'Мариель', 'Негматьянова', 'Айратовна',
        'mariel.2007.zorro@gmail.com', '+77768124650', 'ACTIVE', 'HR', TRUE,
        '$2a$12$ZHM.mbjY.PfCt2Nm23zj6exf8K394Ij0UWQFSmrp8nK4J8bEr7oDi', now()
    ),

    -- Волонтёры-болванки для теста (пароли ниже, реальным людям не принадлежат)
    -- test.volunteer1@example.com / Volunteer1Pass!
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Первый',
        'test.volunteer1@example.com', '+77010000001', 'VOLUNTEER', 'VOLUNTEER', TRUE,
        '$2a$10$cgGbck.Y7aEPgRFkyTCQq.leVPWKeo2WKnR36g6Wt9Bols9odKJ4W', now()
    ),
    -- test.volunteer2@example.com / Volunteer2Pass!
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Второй',
        'test.volunteer2@example.com', '+77010000002', 'VOLUNTEER', 'VOLUNTEER', TRUE,
        '$2a$10$AoAJJDcJG1HbuFd5vWxCJO/bfKGP7VW5tdfU8KSrKe4Uu5UbBxxqe', now()
    ),
    -- test.volunteer3@example.com / Volunteer3Pass!
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Тест', 'Волонтёров', 'Третий',
        'test.volunteer3@example.com', '+77010000003', 'VOLUNTEER', 'VOLUNTEER', TRUE,
        '$2a$10$XNe1L4wike.qmVx/jzn0uOK29aDPFBKhKIXhLdF/zqmKjmtZPzOuq', now()
    ),

    -- Супер-админы
    -- larisspak@gmail.com / Superadmin123.
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Лариса', 'Пак', NULL,
        'larisspak@gmail.com', '+77753183678', 'ACTIVE', 'SUPER_ADMIN', TRUE,
        '$2a$10$qhGZLC8Yjnv2tRcmxPiVpelWLWdm3.LI.l.CyKnuAZr44CNEIUgHW', now()
    ),
    -- aminalekerova13@gmail.com / Superadmin123.
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Амина', 'Лекерова', 'Талгатовна',
        'aminalekerova13@gmail.com', '+77071394323', 'ACTIVE', 'SUPER_ADMIN', TRUE,
        '$2a$10$8mm8jcKHQg4/9ZtyLVqCO.iPRGl9nBvi5mm2Tu85rn9mZK4pVbvvS', now()
    )
ON CONFLICT (email) DO NOTHING;
