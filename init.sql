-- Criar tipos ENUM para garantir consistência de dados
CREATE TYPE perfil_usuario AS ENUM ('ADMIN', 'VENDEDOR');
CREATE TYPE unidade_medida_prod AS ENUM ('UN', 'M3', 'KG', 'MT');
CREATE TYPE forma_pagamento_pedido AS ENUM ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'FIADO');

-- 1. TABELA DE USUÁRIOS (Operadores do caixa)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Hash de segurança
    perfil perfil_usuario NOT NULL DEFAULT 'VENDEDOR',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRODUTOS/ESTOQUE
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- Ex: 'Materiais Básicos', 'Hidráulica', 'Elétrica'
    unidade_medida unidade_medida_prod NOT NULL DEFAULT 'UN',
    peso_unitario_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    qtd_atual NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estoque_minimo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE PEDIDOS (Vendas do balcão)
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_nome VARCHAR(150) DEFAULT 'Cliente Balcão',
    cliente_telefone VARCHAR(20), -- obrigatório quando há pagamento em FIADO
    vendedor_id INT REFERENCES usuarios(id),
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    fiado_pago BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ITENS DO PEDIDO (Suporte a fracionamento - venda por metro, etc.)
CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INT REFERENCES produtos(id),
    quantidade NUMERIC(10,2) NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL
);

-- 5. PAGAMENTOS DO PEDIDO (Suporte a mais de uma forma de pagamento por venda)
CREATE TABLE pagamentos_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    forma_pagamento forma_pagamento_pedido NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0)
);

CREATE INDEX idx_pagamentos_pedido_pedido_id ON pagamentos_pedido(pedido_id);

-- INSERIR DADOS MOCK INICIAIS PARA TESTE LOCAL
-- Senhas em texto plano (para referência): admin123 / caixa123 — já armazenadas como hash bcrypt
INSERT INTO usuarios (nome, email, senha, perfil) VALUES
('Gerente Lobo', 'admin', '$2a$10$cRywTBJl4JyV/OamCVabKOlxZXnV/KJDn/ECtZbJwICcpg9hnSD5W', 'ADMIN'),
('Caixa Balcao 1', 'caixa', '$2a$10$SuiZvIchXU/48fjEaO2Mj.lrhGIQ6S/Q8DTqS4f3Q2KMgNP0be42m', 'VENDEDOR');

INSERT INTO produtos (sku, descricao, categoria, unidade_medida, peso_unitario_kg, qtd_atual, estoque_minimo, preco_custo, preco_venda) VALUES
('CIM-VOT-50', 'Cimento Votoran Todas As Obras 50kg', 'Materiais Básicos', 'UN', 50.00, 200.00, 50.00, 28.00, 36.90),
('ARE-FIN-M3', 'Areia Fina Lavada para Reboco', 'Materiais Básicos', 'M3', 1400.00, 15.00, 5.00, 90.00, 140.00),
('ALU-UNI-UN', 'Alicate Universal Isolado 8 Polegadas', 'Ferramentas', 'UN', 0.35, 12.00, 3.00, 18.00, 32.90),
('TIN-ACR-18L', 'Tinta Acrílica Fosca Branca 18L', 'Acabamento', 'UN', 20.00, 10.00, 2.00, 120.00, 189.90),
('TOR-CRO-12', 'Torneira Cromada 1/2" Metasul', 'Hidráulica', 'UN', 0.40, 20.00, 5.00, 35.00, 69.90),
('DISJ-BI-40A', 'Disjuntor Bipolar 40A', 'Elétrica', 'UN', 0.15, 30.00, 5.00, 12.00, 24.90),
('FIO-FLEX-25', 'Fio Flexível 2,5mm² Cobre', 'Elétrica', 'MT', 0.03, 500.00, 50.00, 1.20, 1.89),
('CABO-PP-3X25', 'Cabo PP 3x2,5mm', 'Elétrica', 'MT', 0.09, 300.00, 30.00, 3.50, 5.90);
