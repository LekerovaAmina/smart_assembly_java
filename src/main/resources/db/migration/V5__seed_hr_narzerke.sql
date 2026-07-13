-- Sprint 1: ещё один HR-аккаунт.
-- Пароль захэширован (BCrypt), в открытом виде нигде не хранится.
-- Если пользователь с таким email уже существует — пропускаем (ON CONFLICT DO NOTHING).

INSERT INTO users (
    assembly_id, first_name, last_name, middle_name,
    email, phone, status, role, is_active,
    password_hash, password_set_at
)
VALUES
    -- nazerkenurjan775@gmail.com / nazerkenurjan775
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Назерке', 'Нұржан', 'Ерланқызы',
        'nazerkenurjan775@gmail.com', '+77778892551', 'ACTIVE', 'HR', TRUE,
        '$2a$10$OoXDEc.BvenJfiEiN1gXqe6AWeVmqDfvD.RhIU8WoTXHOJ.rQNm/K', now()
    )
ON CONFLICT (email) DO NOTHING;
