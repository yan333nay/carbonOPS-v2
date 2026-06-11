# Carbon Films OS

Sistema de agentes operacionais para a Carbon Films.

---

## Setup (5 minutos)

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# edite .env com sua ANTHROPIC_API_KEY e credenciais do PostgreSQL
```

### 3. Criar banco de dados
```bash
psql -U postgres -c "CREATE DATABASE carbonfilms;"
psql -U postgres -d carbonfilms -f company-brain/setup.sql
```

### 4. Preencher o company-brain
Edite os arquivos em `/company-brain/` com os dados reais da empresa.
Comece por:
- `company.json` — dados básicos
- `offers.md` — seus serviços e preços
- `vision.md` — objetivos

---

## Comandos

Abra o projeto no Claude Code e use:

| Comando | Como rodar |
|---------|-----------|
| `/manager "objetivo"` | `python commands/manager.py "objetivo"` |
| `/run <agente>` | `python commands/run.py leads` |
| `/status` | `python commands/status.py` |
| `/report` | `python commands/report.py` |
| `/brain` | `python commands/brain.py` |

### Fluxo típico

```bash
# 1. Dar um objetivo ao Manager
python commands/manager.py "Quero 10 reuniões com imobiliárias esse mês"

# 2. Ver as tarefas criadas
python commands/status.py

# 3. Executar agente de leads
python commands/run.py leads

# 4. Executar agente de campanha
python commands/run.py campaign

# 5. Ver relatório
python commands/report.py
```

---

## Estrutura

```
/company-brain/     → Bíblia da operação
/manager/           → Persona e lógica do Manager
/workers/           → Um worker por agente
  /leads/
  /campaign/
  /sdr/
  /analyst/
  /social/
/commands/          → Scripts dos comandos /slash
/core/              → DB, config, cliente Claude
```

---

## Agentes

| Agente | Função |
|--------|--------|
| `leads` | Prospecção e qualificação |
| `campaign` | Cadência e follow-up |
| `sdr` | Negociação e propostas |
| `analyst` | Análise e aprendizado |
| `social` | Conteúdo e redes sociais |
