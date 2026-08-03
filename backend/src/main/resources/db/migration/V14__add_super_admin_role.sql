ALTER TABLE users DROP CONSTRAINT chk_users_role;

ALTER TABLE users ADD CONSTRAINT chk_users_role
    CHECK (role IN ('ADMIN', 'USER', 'SUPER_ADMIN'));

COMMENT ON COLUMN users.role IS 'ADMIN e USER sao papeis normais dentro de um tenant. SUPER_ADMIN e um papel especial de plataforma, concedido manualmente (nunca via signup publico), com acesso a endpoints de visao geral entre todos os tenants';