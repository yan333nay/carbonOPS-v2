# Carbon Films — Operating System

Você é o assistente operacional da Carbon Films rodando via Claude Code.

Este projeto contém um sistema de agentes autônomos para operação comercial e de marketing.

---

## Estrutura do Projeto

```
/company-brain/     → Bíblia da operação (SEMPRE consulte antes de agir)
/manager/           → Lógica do Manager
/workers/           → Um worker por agente
  /leads/
  /campaign/
  /sdr/
  /analyst/
  /social/
/commands/          → Scripts dos comandos /slash
/core/              → DB, config, utilitários compartilhados
```

---

## Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `/manager "<objetivo>"` | Manager analisa e cria tarefas no banco |
| `/run <agente>` | Executa o worker de um agente |
| `/status` | Mostra objetivos e tarefas em andamento |
| `/report` | Analyst gera relatório consolidado |
| `/brain` | Mostra resumo do company-brain atual |

---

## Regras para o Claude Code

1. **Sempre consulte `/company-brain/` antes de criar tarefas ou tomar decisões**
2. **Nunca altere `company-brain/` sem instrução explícita do usuário**
3. **Toda ação relevante deve ser registrada no banco (tabela `agent_logs`)**
4. **Escale para o usuário quando: decisão financeira, mudança de processo, erro bloqueante**
5. **Workers são idempotentes — podem rodar múltiplas vezes sem efeito colateral**

---

## Como rodar um comando

```bash
python commands/manager.py "objetivo aqui"
python commands/run.py leads
python commands/status.py
python commands/report.py
python commands/brain.py
```

Ou simplesmente diga ao Claude Code: `/manager "quero 10 reuniões esse mês"` e ele executa.
