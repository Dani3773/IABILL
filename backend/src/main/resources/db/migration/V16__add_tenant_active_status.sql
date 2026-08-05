ALTER TABLE tenants ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN tenants.active IS 'Se false, todos os usuarios deste tenant sao bloqueados de acessar o sistema (exceto Super-Admin, que nao pertence a nenhum tenant)';