# Guia de Automação — n8n (Carbon Films)
**Versão:** 1.0 | **Criado:** 2026-04-29
**Substitui:** `docs/guia-make.md` (Make foi substituído por n8n)

---

## O que é o n8n

O n8n é a plataforma de automação escolhida pela Carbon Films para orquestrar os processos dos agentes de IA. Diferente do Make (Integromat), o n8n pode ser auto-hospedado (self-hosted) ou usado na nuvem (n8n Cloud), o que dá controle total sobre dados e custos.

**Opções de deploy:**
- **n8n Cloud** — recomendado para início (sem infraestrutura própria). Plano Starter: ~US$24/mês
- **Self-hosted** — em VPS/servidor próprio (Docker). Custo: apenas o servidor (~R$50-100/mês)

**URL de acesso:** após setup, interface web em `http://seu-servidor:5678` ou na URL do n8n Cloud

---

## Estrutura de Workflows por Processo

A Carbon Films usa **7 workflows principais** no n8n, um por função de automação:

```
WF-01  Recebimento de Lead e Registro no ClickUp
WF-02  Agendamento e Lembretes de Reunião (PULSE-01 / PULSE-02)
WF-03  Follow-up de Proposta (PULSE-03 / PULSE-04)
WF-04  Onboarding — Criação de Estrutura no ClickUp (FLUX-05)
WF-05  Relatório Semanal de Saúde Operacional (FLUX)
WF-06  Sequência de Outbound (P09 — NOVA + PULSE)
WF-07  Monitoramento de Tarefas e Alertas de Prazo (FLUX-07 / FLUX-08)
```

---

## WF-01 — Recebimento de Lead e Registro no ClickUp

**Trigger:** Webhook (recebe chamada do canal de entrada)
**Executa:** FLUX-01

```
[Webhook]
    │ POST com dados do lead
    ▼
[Code Node] — formatar dados
    • nome (ou "Lead [data]" se ausente)
    • canal de origem
    • timestamp
    • texto da primeira mensagem
    ▼
[HTTP Request] — criar task no ClickUp
    • URL: POST https://api.clickup.com/api/v2/list/{LIST_ID}/task
    • Headers: Authorization: Bearer {CLICKUP_TOKEN}
    • Body: {
        "name": "Lead: [nome]",
        "description": "[texto da mensagem]",
        "status": "Aguardando qualificação NOVA",
        "custom_fields": [
          {"id": "canal", "value": "[canal]"},
          {"id": "data_contato", "value": "[timestamp]"}
        ]
      }
    ▼
[HTTP Request] — notificar CEO-ATLAS via WhatsApp
    • Mensagem: "FLUX: Novo lead registrado — [nome] via [canal] às [hora]"
```

**Nodes necessários:** Webhook, Code, HTTP Request (×2)

---

## WF-02 — Lembretes de Reunião (PULSE-01 e PULSE-02)

**Trigger:** Schedule (verifica Google Agenda a cada 30 min)
**Executa:** PULSE-01 (1h antes) e PULSE-02 (5 min antes)

```
[Schedule Trigger] — a cada 30 minutos
    ▼
[HTTP Request] — buscar eventos do Google Agenda
    • GET https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events
    • Parâmetros: timeMin=agora, timeMax=agora+90min
    ▼
[IF Node] — há evento com WhatsApp do participante?
    │
    ├─ SIM
    │    ▼
    │  [Code Node] — calcular tempo até o evento
    │    ▼
    │  [Switch Node] — quando enviar?
    │    ├─ 60 min antes → enviar PULSE-01
    │    │     ▼
    │    │   [HTTP Request] — WhatsApp API
    │    │   Mensagem: "PULSE: Olá, [Nome]! 👋 Passando para lembrar..."
    │    │
    │    └─ 5 min antes → verificar link Meet
    │          ▼
    │        [IF Node] — link Meet preenchido?
    │          ├─ SIM → enviar PULSE-02 com link
    │          └─ NÃO → alertar FLUX: "⚠️ Link Meet ausente — [evento]"
    │
    └─ NÃO → fim (não executar)
    ▼
[HTTP Request] — log no ClickUp
    • Registrar: tipo da mensagem, data/hora, status de envio
```

**Regras de horário:**
- Não enviar entre 19h01 e 07h59 (segunda a sexta)
- Não enviar entre 13h01 e 08h59 (sábado)
- Domingo: não enviar
- Adicionar IF Node de validação de horário antes de qualquer envio

---

## WF-03 — Follow-up de Proposta (PULSE-03 e PULSE-04)

**Trigger:** Schedule diário às 09h
**Executa:** PULSE-03 (D+2) e PULSE-04 (D+7)

```
[Schedule Trigger] — diariamente às 09h
    ▼
[HTTP Request] — buscar tasks com status "Proposta Enviada" no ClickUp
    ▼
[Code Node] — para cada task:
    • calcular dias desde o envio
    • verificar se já houve resposta (campo no ClickUp)
    ▼
[Switch Node] — qual ação?
    ├─ D+2 sem resposta → enviar PULSE-03
    │     ▼
    │   [HTTP Request] — WhatsApp
    │   Mensagem: "PULSE: Olá, [Nome]! 😊 Passando para ver..."
    │     ▼
    │   [HTTP Request] — log no ClickUp
    │
    ├─ D+7 sem resposta → enviar PULSE-04 + notificar VECTOR
    │     ▼
    │   [HTTP Request] — WhatsApp (PULSE-04)
    │     ▼
    │   [HTTP Request] — WhatsApp VECTOR/CEO-ATLAS
    │   Mensagem: "PULSE: Proposta [Nome] sem resposta em D+7. VECTOR: avaliar ajuste."
    │     ▼
    │   [HTTP Request] — log no ClickUp
    │
    └─ Status fechado/respondido → cancelar agendamentos pendentes
```

**Variável a preencher:** `DATA_VALIDADE` = data do envio + 15 dias (calculado no Code Node)

---

## WF-04 — Onboarding: Criação de Estrutura no ClickUp (FLUX-05)

**Trigger:** Webhook (disparado quando task avança para "Contrato Assinado")
**Executa:** FLUX-05

```
[Webhook]
    │ dados: nome do cliente, serviços contratados, data de início
    ▼
[HTTP Request] — criar pasta do cliente no Space OPERAÇÕES
    • POST /folder: "OdontoFlex — Carbon Films"
    ▼
[HTTP Request × 4] — criar subpastas
    • Onboarding / Execução — Mês Atual / Relatórios / Histórico
    ▼
[HTTP Request] — criar checklist de onboarding (19 itens)
    • POST /task com checklist completo
    • Prazo: D+14
    ▼
[HTTP Request] — criar registro em Contratos Ativos (FINANCEIRO)
    • dados: cliente, valor, início, vencimento
    ▼
[HTTP Request × 2] — notificações
    • WhatsApp Yan: "FLUX: OdontoFlex entrou em operação. Onboarding iniciado."
    • WhatsApp NOVA: "FLUX: Enviar e-mail de boas-vindas para Dr. Carlos — OdontoFlex"
```

---

## WF-05 — Relatório Semanal de Saúde Operacional (FLUX)

**Trigger:** Schedule — toda segunda-feira às 08h
**Executa:** Relatório semanal para CEO-ATLAS e Yan

```
[Schedule Trigger] — segunda-feira 08h
    ▼
[HTTP Request] — buscar todas as tasks abertas no ClickUp
    ▼
[Code Node] — classificar:
    • ATRASADAS: tasks com prazo < hoje e status ≠ "Concluído"
    • VENCENDO: tasks com prazo entre hoje e +7 dias
    • NO PRAZO: demais
    • Contar: clientes ativos, tasks abertas, concluídas na semana passada
    ▼
[Code Node] — montar relatório em texto
    • Formato do template FLUX (seções 🔴🟡🟢📊)
    ▼
[HTTP Request × 2] — enviar
    • WhatsApp CEO-ATLAS: relatório completo
    • WhatsApp Yan: mesmo relatório
```

---

## WF-06 — Sequência de Outbound (P09)

**Trigger:** Webhook (disparado quando VECTOR registra novo alvo no ClickUp)
**Executa:** Sequência NOVA + PULSE para Prospecção Ativa

```
[Webhook]
    │ dados: nome, empresa, canal de abordagem, gancho personalizado
    ▼
[Code Node] — montar MSG-OUT-01/02/03 personalizada
    ▼
[HTTP Request] — enviar primeiro contato via canal definido
    (WhatsApp / LinkedIn / E-mail conforme campo "canal" da task)
    ▼
[HTTP Request] — registrar no ClickUp: "Contato enviado — D+0"
    ▼
[Wait Node] — aguardar 3 dias
    ▼
[HTTP Request] — verificar status no ClickUp: houve resposta?
    ▼
[IF Node]
    ├─ Respondeu com interesse → notificar NOVA para assumir
    ├─ Resposta negativa → registrar motivo + programar nutrição 90 dias
    └─ Sem resposta → enviar MSG-OUT-04 (follow-up D+3)
                          ▼
                    [Wait Node] — 4 dias
                          ▼
                    [IF Node] — respondeu?
                    ├─ SIM → notificar NOVA
                    └─ NÃO → enviar MSG-OUT-05 (breakup D+7)
                               ▼
                          Registrar como "Sem resposta" + nutrição 90 dias
```

---

## WF-07 — Monitoramento de Prazos (FLUX-07 / FLUX-08)

**Trigger:** Schedule — diariamente às 08h30
**Executa:** Alertas de prazo vencendo e aprovações pendentes

```
[Schedule Trigger] — 08h30 diariamente
    ▼
[HTTP Request] — buscar tasks por prazo no ClickUp
    ▼
[Code Node] — identificar:
    A) Tasks de entrega ao cliente vencendo em 24h
    B) Tasks vencidas há 1+ dia sem atualização
    C) Tasks "Aguardando aprovação do cliente" há 48h+
    ▼
[Switch Node] — tipo de alerta
    ├─ A) Vencendo em 24h
    │     → Notificar responsável + CEO-ATLAS
    │
    ├─ B) Vencida D+1
    │     → Escalar para CEO-ATLAS: "Task vencida [nome] — [cliente]"
    │
    └─ C) Aprovação pendente 48h
          → Notificar NOVA para follow-up gentil com cliente
          → Se 72h: escalar para CEO-ATLAS
```

---

## Configuração Inicial do n8n

### Credenciais necessárias

| Serviço | Tipo | Onde obter |
|---------|------|-----------|
| ClickUp | API Key | clickup.com → Settings → Apps |
| WhatsApp Business API | Token 360dialog ou Meta | ver `guia-ferramentas.md` |
| Google Calendar | OAuth2 | console.cloud.google.com |
| Anthropic Claude | API Key | console.anthropic.com |
| n8n próprio | Conta | n8n.io ou self-hosted |

### Ordem de setup recomendada

1. Criar conta n8n Cloud (ou subir Docker)
2. Adicionar credencial do ClickUp
3. Adicionar credencial do WhatsApp API
4. Adicionar credencial do Google Calendar (OAuth2)
5. Importar WF-02 primeiro (lembretes — menor risco) e testar
6. Importar WF-03 (follow-up de proposta)
7. Importar WF-01 (recebimento de lead — requer webhook configurado)
8. Importar WF-04 (onboarding — testar com cliente fictício)
9. Importar WF-05 (relatório semanal)
10. Importar WF-06 (outbound — ativar apenas após P09 operacional)
11. Importar WF-07 (monitoramento de prazos)

### Variáveis de ambiente para configurar

```
CLICKUP_TOKEN=pk_xxxxx
CLICKUP_WORKSPACE_ID=xxxxx
CLICKUP_SPACE_COMERCIAL=xxxxx
CLICKUP_SPACE_OPERACOES=xxxxx
CLICKUP_SPACE_FINANCEIRO=xxxxx
WHATSAPP_API_URL=https://waba.360dialog.io/v1
WHATSAPP_API_KEY=xxxxx
WHATSAPP_NUMBER_ID=xxxxx
GOOGLE_CALENDAR_ID=xxxxx
YAN_WHATSAPP=5547892227584
```

---

## Diferenças n8n vs. Make (referência)

| Aspecto | Make (anterior) | n8n (atual) |
|---------|----------------|-------------|
| Modelo de preço | Por operação (caro em volume) | Por workflow (previsível) |
| Self-hosted | Não | Sim (Docker) |
| Controle de dados | Cloud apenas | Total (self-hosted) |
| Editor visual | Sim | Sim |
| Nodes nativos Claude | Não | Sim (HTTP Request para API) |
| Debugging | Moderado | Excelente (execuções detalhadas) |
| Curva de aprendizado | Baixa | Baixa-Média |

---

## Próximos Passos

1. **Yan decide**: n8n Cloud ou self-hosted?
2. Criar conta / subir servidor
3. Configurar credenciais (lista acima)
4. Implementar WF-02 como primeiro teste (menor risco)
5. Ligar ao ClickUp e testar com reunião real
