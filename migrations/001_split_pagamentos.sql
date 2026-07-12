-- Permite registrar mais de uma forma de pagamento por venda (ex: parte em dinheiro + parte fiado).
-- Rodar uma única vez contra o banco de produção (Supabase SQL editor ou `psql $DATABASE_URL -f migrations/001_split_pagamentos.sql`).

BEGIN;

CREATE TABLE pagamentos_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    forma_pagamento forma_pagamento_pedido NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0)
);

CREATE INDEX idx_pagamentos_pedido_pedido_id ON pagamentos_pedido(pedido_id);

-- Backfill: cada pedido existente tinha exatamente uma forma de pagamento pelo total da venda.
INSERT INTO pagamentos_pedido (pedido_id, forma_pagamento, valor)
SELECT id, forma_pagamento, total FROM pedidos;

ALTER TABLE pedidos DROP COLUMN forma_pagamento;

COMMIT;
