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
        'Индира', 'Жақсылық', 'Жеңісбекқызы',
        'indirazaksylyk41@gmail.com', '+77750635305', 'ACTIVE', 'HR', TRUE,
        '$2a$10$7RW.4q7cA.ATcfEALUjACuFKCktJm1102jN4LbsYjI/H.vni5my22', now()
    ),
    (
        (SELECT assembly_id FROM assemblies ORDER BY assembly_id LIMIT 1),
        'Милана', 'Сондрагайло', 'Григорьевна',
        'milmila0307@gmail.com', '+77474150577', 'ACTIVE', 'HR', TRUE,
        '$2a$10$TanO.cJFpllujIJhUlu4c.I0C3O9wHhkHAtGXcCq/CDocgQ55/U26', now()
    )
ON CONFLICT (email) DO NOTHING;
