# Mapa de Agentes — Carbon Films

---

## Hierarquia

```
Yan Zeitz (humano)
        │
   /architech ──────── decisões de sistema, visão, novos agentes
        │
   ARCHITECT
        │
   /manager ─────────── objetivos operacionais, criação de tarefas
        │
   MANAGER
        │
   ┌────┬────┬────┬────┬────┐
   │    │    │    │    │    │
 leads camp sdr analy social
```

---

## Agentes

### 🏛️ Architect
**Localização:** `/architect/architect.md`
**Comando:** `/architech "pergunta ou problema"`
**Papel:** Visão estratégica, design do sistema, decisões arquiteturais, spec de novos agentes.
**NÃO executa tarefas operacionais.**
**Escalada para Yan quando:** decisão financeira, mudança de processo de vendas, nova integração.

### 🧠 Manager
**Localização:** `/manager/manager.md`
**Comando:** `/manager "objetivo"`
**Papel:** Recebe objetivos, analisa, cria tarefas para workers, acompanha progresso.
**NÃO executa tarefas diretamente.**

### 🔍 Leads Agent
**Script real:** `/root/leads-agent/index.js`
**Cron:** seg-sex 08:00 BRT
**Papel:** Prospecta empresas locais via DuckDuckGo + Playwright. Busca os 3 segmentos ICP: `clinicas`, `imobiliarias`, `restaurantes`. Salva no Carbon Hub (PostgreSQL) com campo `setor` preenchido por segmento.
**Output:** Contatos segmentados no Carbon Hub com email + setor definido.

### 📩 Campaign Agent
**Script real:** `/root/whatsapp-sales/index.js` + `webhook-server.js`
**Processo:** Contínuo 24/7 (watchdog a cada 5min)
**Papel:** Cadência de prospecção (5 passos, 5 dias). Anti-bloqueio ativo.
**Output:** Mensagens enviadas, leads respondidos → SDR.

### 💬 SDR Agent
**Script real:** `/root/whatsapp-sales/src/negotiation.js`
**Trigger:** Webhook ao receber mensagem de lead
**Papel:** Qualificação, negociação, agendamento de reuniões (Claude Haiku 4.5).
**Output:** Reuniões no Google Calendar, notificação ao Yan.

### 📊 Analyst Agent
**Script real:** `/root/whatsapp-sales/scripts/conversation-analyst.js`
**Cron:** Segunda 07:30 BRT
**Papel:** Analisa conversas, extrai 5 regras → `learned-rules.json` → SDR aplica automaticamente.

### 📱 Social Agent
**Script real:** `/root/social-media/scripts/auto-carousel.js` + `story-pipeline.js`
**Cron:** 5 posts/semana (auto-carousel) + seg-sex 14h (story)
**Papel:** Carrosséis Instagram + stories via Buffer API.

---

## Regras de comunicação

1. Yan → Architect (via /architech) ou Manager (via /manager)
2. Architect → Manager (via [CRIAR_OBJETIVO] ou /manager)
3. Manager → Workers (via tabela `tasks` no SQLite)
4. Workers → Scripts reais na VPS (Node.js)
5. Nenhum agente altera dados de outro sem passar por tarefa

---

## Status

| Agente    | Status   | Script VPS                          |
|-----------|----------|-------------------------------------|
| Architect | Ativo    | commands/architect.py               |
| Manager   | Ativo    | commands/manager.py                 |
| Leads     | Ativo    | /root/leads-agent/index.js (3 segmentos ICP) |
| Campaign  | Ativo    | /root/whatsapp-sales/index.js       |
| SDR       | Ativo    | /root/whatsapp-sales/src/negotiation.js |
| Analyst   | Ativo    | /root/whatsapp-sales/scripts/conversation-analyst.js |
| Social    | Ativo    | /root/social-media/scripts/auto-carousel.js |
