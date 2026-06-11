# Mapa de Agentes — Carbon Films

> Documento central de governança. Define quem faz o quê, como se comunicam e quais são os limites de cada agente.

---

## Hierarquia

```
Manager
│
├── Comercial
│   ├── Leads Agent      — prospecção e qualificação
│   ├── Campaign Agent   — cadência e follow-up
│   ├── SDR Agent        — negociação e reuniões
│   └── Analyst Agent    — aprendizado e melhoria
│
├── Marketing
│   └── Social Agent     — conteúdo e redes sociais
│
└── Produto
    └── CRM Dev          — sistema e automações
```

---

## Agentes

### 🧠 Manager
**Localização:** `/manager/manager.md`  
**Papel:** Coordenação estratégica. Recebe objetivos, cria tarefas, acompanha resultados.  
**NÃO executa tarefas diretamente.**  
**Inputs:** Objetivos humanos (tabela `objectives`)  
**Outputs:** Tarefas (tabela `tasks`)

---

### 🔍 Leads Agent
**Status:** Ativo  
**Papel:** Encontrar e qualificar leads dentro do perfil ideal de cliente.  
**Fontes:** Instagram, Google Maps, LinkedIn, indicações  
**Output:** Leads qualificados no CRM com status `new`  
**Critérios de qualificação:** Ver `sales-process.md`

---

### 📩 Campaign Agent
**Status:** Ativo  
**Papel:** Gerenciar cadência de mensagens para leads.  
**Canais:** WhatsApp, Instagram DM  
**Cadência:** Ver `sales-process.md` → Estágio 3  
**Output:** Atualizações de status no CRM + logs de mensagens

---

### 💬 SDR Agent
**Status:** Ativo  
**Papel:** Qualificação profunda, gestão de conversas ativas, preparação de propostas.  
**Escalada para humano quando:** Cliente quer reunião, tem objeção complexa, pede proposta personalizada.  
**Output:** Reuniões agendadas, rascunhos de proposta

---

### 📊 Analyst Agent
**Status:** Ativo  
**Papel:** Analisar resultados das operações. Identificar padrões. Sugerir melhorias.  
**Frequência:** Relatório semanal  
**Output:** Insights para o Manager, atualizações nos documentos do `company-brain`

---

### 📱 Social Agent
**Status:** Ativo  
**Papel:** Criar e agendar conteúdo para redes sociais.  
**Guia:** Ver `social-strategy.md`  
**Output:** Posts agendados, relatório de performance semanal

---

### 🛠️ CRM Dev
**Status:** Em desenvolvimento  
**Papel:** Manutenção e evolução do CRM local.  
**Não é um agente autônomo ainda — é trabalho humano/Claude Dev.**

---

## Regras de Comunicação entre Agentes

1. Agentes **não se chamam diretamente** — toda coordenação passa pelo Manager ou pela tabela `tasks`.
2. Nenhum agente deve **alterar dados de outro agente** sem passar por tarefa.
3. Toda ação relevante deve ser **registrada** (tabela `tasks` ou logs).
4. Em caso de dúvida sobre o que fazer, o agente deve **escalar para o Manager**, não tomar decisão sozinho.

---

## Status dos Agentes

| Agente | Status | Última atualização |
|--------|--------|--------------------|
| Manager | Planejado | — |
| Leads | Ativo | — |
| Campaign | Ativo | — |
| SDR | Ativo | — |
| Analyst | Ativo | — |
| Social | Ativo | — |
| CRM Dev | Em desenvolvimento | — |
