-- Informações que o RGPD (e, em parte, a LGPD) pede e que o ROPA ainda não guardava.
ALTER TABLE processing_activities
    -- Art. 26 RGPD: corresponsáveis que decidem o tratamento em conjunto com a empresa
    ADD COLUMN joint_controllers                TEXT,
    -- Art. 22 RGPD / Art. 20 LGPD: decisões tomadas só por meio automatizado, inclusive perfis
    ADD COLUMN involves_automated_decisions     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN automated_decision_safeguards    TEXT,
    -- Art. 8 RGPD / Art. 14 LGPD: dados de crianças e adolescentes
    ADD COLUMN involves_children_data           BOOLEAN NOT NULL DEFAULT FALSE,
    -- Art. 30, n.º 1, al. e) RGPD / Art. 33 LGPD: transferência para fora do país ou do EEE
    ADD COLUMN involves_international_transfer  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN international_transfer_details   TEXT;

-- Art. 27 RGPD: representante na União Europeia, exigido de quem trata dados de
-- pessoas na UE sem ter estabelecimento lá.
ALTER TABLE workspaces
    ADD COLUMN eu_representative VARCHAR(255);
