-- ============================================
-- Carbon Films — Database Setup
-- Execute no PostgreSQL local
-- ============================================

-- Tabela de agentes
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(50),
    role TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir agentes
INSERT INTO agents (name, department, role, status) VALUES
('social',   'marketing',  'Conteúdo e redes sociais',              'active'),
('leads',    'comercial',  'Prospecção e qualificação de leads',     'active'),
('campaign', 'comercial',  'Cadência de mensagens e follow-up',      'active'),
('sdr',      'comercial',  'Negociação e agendamento de reuniões',   'active'),
('analyst',  'comercial',  'Análise de resultados e aprendizado',    'active'),
('crm_dev',  'produto',    'Desenvolvimento e manutenção do CRM',    'development')
ON CONFLICT (name) DO NOTHING;

-- ============================================

-- Tabela de objetivos (input do humano para o Manager)
CREATE TABLE IF NOT EXISTS objectives (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    objective TEXT NOT NULL,
    department VARCHAR(50),          -- comercial | marketing | produto | todos
    priority VARCHAR(20) DEFAULT 'medium',  -- high | medium | low
    status VARCHAR(20) DEFAULT 'open',      -- open | in_progress | done | cancelled
    deadline DATE,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================

-- Tabela de tarefas (criadas pelo Manager, executadas pelos agentes)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    objective_id INTEGER REFERENCES objectives(id),
    agent VARCHAR(50) REFERENCES agents(name),
    task TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',   -- high | medium | low
    status VARCHAR(20) DEFAULT 'pending',    -- pending | running | done | failed | blocked
    result TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================

-- Tabela de logs (registro de todas as ações dos agentes)
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(50),
    task_id INTEGER REFERENCES tasks(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================

-- Tabela de leads (se ainda não existir no CRM)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    company VARCHAR(200),
    segment VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    contact_instagram VARCHAR(100),
    source VARCHAR(100),            -- instagram | google_maps | linkedin | referral
    status VARCHAR(50) DEFAULT 'new',
    -- new | contacted | replied | qualified | meeting_scheduled | proposal_sent | won | lost | cold
    notes TEXT,
    assigned_agent VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================

-- Views úteis

-- Tarefas pendentes por agente
CREATE OR REPLACE VIEW pending_tasks_by_agent AS
SELECT 
    agent,
    COUNT(*) as total_pending,
    STRING_AGG(task, ' | ' ORDER BY priority DESC) as tasks_summary
FROM tasks
WHERE status = 'pending'
GROUP BY agent
ORDER BY total_pending DESC;

-- Objetivos em andamento
CREATE OR REPLACE VIEW active_objectives AS
SELECT 
    o.id,
    o.title,
    o.department,
    o.priority,
    o.status as objective_status,
    o.deadline,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_tasks
FROM objectives o
LEFT JOIN tasks t ON t.objective_id = o.id
WHERE o.status IN ('open', 'in_progress')
GROUP BY o.id
ORDER BY o.priority DESC, o.created_at ASC;

-- ============================================

-- Exemplos de uso (comentados)

/*
-- Criar um objetivo:
INSERT INTO objectives (title, objective, department, priority, deadline)
VALUES (
    'Reuniões com imobiliárias — Julho',
    'Conseguir 10 reuniões qualificadas com imobiliárias da região até o final do mês',
    'comercial',
    'high',
    '2025-07-31'
);

-- Criar tarefas para esse objetivo:
INSERT INTO tasks (objective_id, agent, task, priority) VALUES
(1, 'leads',    'Gerar lista de 50 imobiliárias qualificadas na região', 'high'),
(1, 'leads',    'Enriquecer lista com WhatsApp e Instagram de cada uma', 'high'),
(1, 'campaign', 'Criar sequência de 3 mensagens para abordagem fria', 'high'),
(1, 'campaign', 'Disparar cadência para os 50 leads qualificados', 'medium'),
(1, 'sdr',      'Qualificar respostas e agendar reuniões', 'high'),
(1, 'analyst',  'Monitorar taxa de resposta e ajustar mensagens se <15%', 'medium');

-- Verificar andamento:
SELECT * FROM active_objectives;
SELECT * FROM pending_tasks_by_agent;
*/
