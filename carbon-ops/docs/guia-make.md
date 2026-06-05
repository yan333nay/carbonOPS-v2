# Guia de Configuração do Make — Carbon Films
**Plataforma:** Make (make.com) — recomendado para automações da agência

---

## PASSO 1 — SETUP INICIAL

1. Criar conta em make.com
2. Criar organização: **"Carbon Films"**
3. Criar time (opcional para múltiplos usuários: Yan + Joel)

---

## PASSO 2 — CONECTAR OS SERVIÇOS

Na seção **Connections** do Make, conectar nesta ordem:

### 2.1 ClickUp
1. Add connection → ClickUp
2. Autenticar com a conta da agência
3. Testar: verificar se os Spaces aparecem
4. Nomear a conexão: `ClickUp Carbon Films`

### 2.2 Google (Agenda + Drive)
1. Add connection → Google Calendar
2. Autenticar com a conta Google da agência (não pessoal)
3. Repetir para Google Drive com a mesma conta
4. Nomear: `Google Carbon Films`

### 2.3 WhatsApp Business API
1. Add connection → HTTP (para 360dialog ou Zenvia via API REST)
   *ou* procure o conector nativo do seu provedor
2. Inserir API Key do provedor (360dialog / Zenvia)
3. Testar com envio de mensagem para número de teste

### 2.4 Anthropic Claude API
1. Add connection → HTTP (Make usa HTTP para Anthropic)
2. URL base: `https://api.anthropic.com`
3. Header: `x-api-key: [SUA_API_KEY]`
4. Header: `anthropic-version: 2023-06-01`
5. Nunca salve a API key em texto — use as variáveis de ambiente do Make

### 2.5 Fireflies.ai (transcrição)
1. Add connection → Webhooks (Fireflies envia via webhook)
2. Criar webhook URL no Make
3. Configurar no painel do Fireflies: Settings → Webhooks → colar URL

---

## PASSO 3 — CRIAR OS CENÁRIOS

### CENÁRIO 1: Novo lead → Task no ClickUp + Notificar Yan

**Trigger:** WhatsApp (nova mensagem recebida via webhook)

```
[Webhook — recebe mensagem WhatsApp]
    ↓
[Router — verificar se é mensagem nova ou resposta]
    ↓ (se nova)
[ClickUp — Create Task]
  Lista: "Leads em Qualificação"
  Nome: "Lead — [nome ou número]"
  Campos: Canal = WhatsApp, Data = agora, Primeira mensagem = {texto}
    ↓
[HTTP — Anthropic API — acionar NOVA]
  System: [conteúdo de agents/nova.md]
  User: "Nova mensagem recebida: {texto} | De: {nome} | Canal: WhatsApp"
    ↓
[WhatsApp — enviar resposta de NOVA ao lead]
    ↓
[WhatsApp — notificar Yan]
  "🆕 Novo lead no WhatsApp: {nome/número} — '{primeiros 50 chars da msg}'"
```

**Como testar:** Enviar mensagem para o WhatsApp da agência e verificar se a task aparece no ClickUp.

---

### CENÁRIO 2: Reunião agendada → Evento no Google Agenda + PULSE

**Trigger:** ClickUp (status de task muda para "Reuniões Agendadas")

```
[ClickUp — Watch Task Status Change]
  Filtro: Lista = "Leads em Qualificação", Status novo = "Aprovado p/ Reunião"
    ↓
[Google Calendar — Create Event]
  Título: "Carbon Films x {nome_cliente} — Diagnóstico"
  Data/Hora: {campo data_reuniao da task}
  Conferência: Google Meet (ativar "Add Google Meet")
  Calendário: "Carbon Films — Reuniões com Clientes"
    ↓
[ClickUp — Update Task]
  Campo "Link do Meet": {link gerado pelo Google Calendar}
    ↓
[Router — programar PULSE-01 e PULSE-02]
    ↓ PULSE-01 (1h antes)
[Make — Schedule]
  Horário: {data_reuniao} - 60 min
  Executar: Cenário PULSE-01 com dados do lead
    ↓ PULSE-02 (5 min antes)
[Make — Schedule]
  Horário: {data_reuniao} - 5 min
  Executar: Cenário PULSE-02 com link Meet
```

**Como testar:** Criar task de teste, mover para "Reuniões Agendadas", verificar se evento aparece no Google Agenda com link Meet.

---

### CENÁRIO 3: Nova transcrição → Link no ClickUp + CEO-ATLAS

**Trigger:** Webhook do Fireflies (nova transcrição disponível)

```
[Webhook — Fireflies — nova transcrição]
  Payload: {meeting_title, transcript_url, summary, date}
    ↓
[Router — identificar cliente pelo título da reunião]
  Regra: título contém "Carbon Films x {nome}" → extrair nome do cliente
    ↓
[ClickUp — Search Tasks]
  Buscar task em "Reuniões Agendadas" com nome do cliente
    ↓
[ClickUp — Update Task]
  Campo "Transcrição": {transcript_url}
  Status: "Transcrição disponível"
    ↓
[HTTP — Anthropic API — acionar CEO-ATLAS]
  System: [conteúdo de agents/ceo-atlas.md]
  User: "Transcrição disponível para reunião com {cliente}. URL: {url}.
        Processe e preencha o rascunho da Ficha de Diagnóstico."
    ↓
[ClickUp — Add Comment na task]
  "Ficha de Diagnóstico gerada por CEO-ATLAS: {output do Claude}"
    ↓
[WhatsApp — notificar Yan]
  "📋 Ficha de diagnóstico pronta para {cliente}. Revisar no ClickUp."
```

---

### CENÁRIO 4: Proposta sem resposta → PULSE follow-up

**Trigger:** ClickUp — Schedule (verificar diariamente)

```
[ClickUp — Search Tasks]
  Lista: "Propostas Enviadas"
  Filtro: Status = "Aguardando" AND data_envio < hoje - 2 dias
    ↓
[Iterator — para cada task encontrada]
    ↓
[WhatsApp — enviar PULSE-03]
  Para: {telefone do lead}
  Mensagem: template MSG-Follow-02
    ↓
[ClickUp — Add Comment]
  "Follow-up D+2 enviado por PULSE em {data/hora}"
```

**Variação para D+7:** Mesmo cenário, filtro `< hoje - 7 dias`, usar MSG-Follow-03 e notificar VECTOR.

---

### CENÁRIO 5: Pagamento em atraso → FINN alerta Yan

**Trigger:** ClickUp — Schedule (verificar diariamente às 9h)

```
[ClickUp — Search Tasks]
  Lista: "Contratos Ativos"
  Filtro: Status_pagamento = "Atrasado" OR vencimento < hoje
    ↓
[Iterator]
    ↓
[Router — por dias de atraso]
  1 dia: Notificar Yan (sem mensagem ao cliente)
  3 dias: Acionar NOVA para MSG-Cobrança-D3 + Notificar Yan
  7 dias: Gerar relatório de impacto + Notificar Yan urgente
    ↓ (caso 1 dia)
[WhatsApp — notificar Yan]
  "⚠️ Pagamento em atraso: {cliente} — R${valor} — venceu {data}"
    ↓ (caso 3 dias)
[WhatsApp — enviar ao cliente via NOVA]
  Mensagem: template MSG-Cobrança-D3
[WhatsApp — notificar Yan]
  "⚠️ D+3: {cliente} — Follow-up de cobrança enviado automaticamente"
```

---

### CENÁRIO 6: Contrato vencendo em 30 dias → Alerta de renovação

**Trigger:** ClickUp — Schedule (verificar diariamente às 8h)

```
[ClickUp — Search Tasks]
  Lista: "Contratos Ativos"
  Filtro: data_vencimento = hoje + 30 dias
    ↓
[Iterator]
    ↓
[HTTP — Anthropic API — acionar FINN]
  "Contrato de {cliente} vence em 30 dias. Valor: R${x}. LTV: R${y}.
   Gere recomendação de renovação (mesmo escopo / expansão / reavaliar)."
    ↓
[ClickUp — Create Task]
  Lista: "Renovações — Próximos 30 dias"
  Nome: "Renovação — {cliente} — {data_vencimento}"
  Campo recomendação: {output FINN}
    ↓
[WhatsApp — notificar Yan]
  "📋 Renovação em 30 dias: {cliente}. Recomendação FINN: {resumo}.
   Ver task no ClickUp."
```

---

## PASSO 4 — BOAS PRÁTICAS DO MAKE

**Nomenclatura de cenários:**
Sempre prefixar com o agente responsável:
- `NOVA — Lead WhatsApp recebido`
- `PULSE — Lembrete reunião 1h`
- `FLUX — Transcrição → ClickUp`
- `FINN — Pagamento em atraso`

**Tratamento de erros:**
Em todo cenário, adicione um módulo de "Error Handler":
- Em caso de erro: notificar Yan via WhatsApp com `[ERRO Make] {nome_cenário}: {mensagem}`
- Nunca deixe um cenário falhar silenciosamente

**Histórico de execuções:**
Mantenha o histórico ativado (Settings → Execution log).
Útil para debugar quando algo não funcionou.

**Variáveis de ambiente:**
Use Data Stores do Make para armazenar:
- API Keys (nunca hardcode nos cenários)
- Número de WhatsApp da agência
- IDs dos calendários e listas do ClickUp

**Testar antes de ativar:**
Todo cenário novo → rodar em modo "Run once" com dados reais de teste
→ verificar cada step → só então ativar.
