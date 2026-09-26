-- Приводим значения ролей к терминологии ТЗ: employee вместо staff, viewer вместо readonly
UPDATE users SET role = 'employee' WHERE role = 'staff';
UPDATE users SET role = 'viewer' WHERE role = 'readonly';

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'lawyer', 'employee', 'viewer'));
