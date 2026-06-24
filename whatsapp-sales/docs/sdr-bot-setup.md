# SDR Bot — Guia de Setup Completo
**Carbon Films | Sistema NOVA SDR**
**Criado:** 2026-05-03 | **Status:** Pronto para configurar e testar

---

## O que é este sistema

Um robô SDR (Sales Development Representative) que atua como a NOVA de forma 100% autônoma:

- **Envia primeiro contato** para leads novos adicionados no HubSpot
- **Responde mensagens** recebidas no WhatsApp com IA (NOVA via Claude)
- **Detecta intenção de reunião** e cria automaticamente o Google Meet com o link
- **Faz follow-up** em D+3, D+7 e marca como frio em D+14
- **Alerta Yan** em situações que precisam de intervenção humana

---

## Pré-requisitos

| Serviço | Para que serve | Custo estimado |
|---------|---------------|----------------|
| n8n (Cloud ou VPS) | Rodar os workflows | Cloud ~US$24/mês ou VPS própria |
| HubSpot (CRM) | Gerenciar leads e histórico | Grátis até 1M contatos |
| WhatsApp Business API | Enviar/receber mensagens | Ver opções abaixo |
| Anthropic API | Inteligência da NOVA | ~$20/mês para volume médio |
| Google Calendar API | Criar reuniões com Meet | Grátis com conta Google |

---

## PASSO 1 — HubSpot: Criar propriedades customizadas

Acesse: HubSpot → Configurações → Propriedades → Deals → Criar propriedade

Criar as seguintes propriedades no objeto **Deal**:

| Nome interno | Rótulo | Tipo |
|---|---|---|
| `sdr_estado` | SDR Estado | Dropdown (ver opções abaixo) |
| `sdr_historico` | SDR Histórico de Conversa | Multi-line text |
| `sdr_tentativas` | SDR Tentativas de Contato | Number |
| `sdr_ultimo_contato` | SDR Último Contato (timestamp) | Single-line text |
| `sdr_ponto_dor` | SDR Ponto de Dor | Multi-line text |
| `sdr_gancho` | SDR Gancho MIRA | Multi-line text |
| `contato_nome` | Contato Nome | Single-line text |
| `contato_whatsapp` | Contato WhatsApp | Phone number |
| `contato_email` | Contato Email | Email |
| `segmento` | Segmento do Negócio | Single-line text |
| `canal_outbound` | Canal Outbound | Dropdown: WhatsApp, Instagram, LinkedIn, Email |
| `meet_link` | Google Meet Link | URL |
| `meet_event_id` | Google Calendar Event ID | Single-line text |

**Opções do campo `sdr_estado`:**
- `NOVO` — criado, aguardando primeiro contato
- `CONTATO_ENVIADO` — primeiro contato enviado
- `EM_CONVERSA` — lead respondeu, conversa ativa
- `FOLLOWUP_1` — D+3, aguardando resposta
- `FOLLOWUP_2` — D+7, aguardando resposta
- `QUALIFICADO` — qualificado pela NOVA
- `AGUARDANDO_YAN` — aguardando validação de Yan
- `REUNIAO_PROPOSTA` — horários propostos, aguardando confirmação
- `REUNIAO_CONFIRMADA` — reunião marcada, Meet criado
- `LEAD_FRIO` — D+14 sem resposta
- `ENCERRADO` — finalizado (ganho ou perdido)

---

## PASSO 2 — HubSpot: Criar Pipeline SDR

Acesse: HubSpot → Configurações → Deals → Pipelines → Criar pipeline

**Nome do pipeline:** `SDR - Carbon Films`

Estágios (nessa ordem):

| Estágio | Nome | % Probabilidade |
|---------|------|-----------------|
| `stage_novo` | 🆕 Novo Lead | 5% |
| `stage_contato` | 📤 Contato Enviado | 10% |
| `stage_conversa` | 💬 Em Conversa | 20% |
| `stage_qualificado` | ✅ Qualificado | 40% |
| `stage_reuniao` | 📅 Reunião Agendada | 60% |
| `stage_proposta` | 📋 Proposta Enviada | 75% |
| `stage_ganho` | 🏆 Fechado — Ganho | 100% |
| `stage_frio` | 🧊 Lead Frio | 0% |
| `stage_perdido` | ❌ Fechado — Perdido | 0% |

**Após criar o pipeline, anote os IDs dos estágios** (aparecem na URL ao editar cada estágio).

---

## PASSO 3 — HubSpot: Gerar Token API

1. Acesse: HubSpot → Configurações → Integrações → Aplicativos privados
2. Criar novo app privado com nome "Carbon SDR Bot"
3. Escopos necessários:
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.notes.write`
4. Gerar token e copiar

---

## PASSO 4 — WhatsApp Business API

### Opção A — 360dialog (recomendado para início)
1. Criar conta em https://360dialog.com
2. Conectar número WhatsApp Business
3. Obter API Key no dashboard
4. URL da API: `https://waba.360dialog.io/v1/messages`
5. Configurar webhook: `https://SEU_N8N/webhook/sdr/inbound`

### Opção B — Meta Business API (oficial)
1. Acessar Meta for Developers: https://developers.facebook.com
2. Criar app tipo "Business"
3. Adicionar produto "WhatsApp"
4. Obter Phone Number ID e Token permanente
5. Configurar webhook para receber mensagens
6. Alterar URL nos workflows para: `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
7. Alterar header de `D360-API-KEY` para `Authorization: Bearer {TOKEN}`

### Opção C — Evolution API (auto-hospedado, mais barato)
1. Instalar Evolution API na VPS: https://github.com/EvolutionAPI/evolution-api
2. Criar instância para o número
3. URL da API e webhook configuráveis no painel
4. Adaptar formato nos code nodes (já suportado pelo WF-SDR-01)

---

## PASSO 5 — Google Calendar API

1. Acessar: https://console.cloud.google.com
2. Criar projeto "Carbon Films SDR"
3. Ativar APIs: Google Calendar API
4. Criar credenciais OAuth 2.0 (tipo: Desktop App)
5. Gerar token OAuth com escopo `https://www.googleapis.com/auth/calendar`
6. Copiar access token (renovar periodicamente ou usar Service Account)
7. Copiar o Calendar ID da agenda de Yan (encontrado em Google Calendar → Configurações da agenda)

> **Dica:** Para não precisar renovar token: use uma Service Account com acesso à agenda.

---

## PASSO 6 — Configurar variáveis no n8n

Acesse: n8n → Settings → Variables → Add Variable

| Variável | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | sk-ant-... |
| `HUBSPOT_TOKEN` | seu token HubSpot |
| `WHATSAPP_API_KEY` | sua key 360dialog/Meta |
| `WHATSAPP_API_URL` | https://waba.360dialog.io/v1/messages |
| `YAN_WHATSAPP` | 5547892270584 (número Yan sem +) |
| `GOOGLE_CALENDAR_ID` | email@gmail.com ou calendar_id |
| `GOOGLE_OAUTH_TOKEN` | ya29.xxx |
| `HUBSPOT_PIPELINE_SDR` | ID do pipeline SDR |
| `HUBSPOT_STAGE_NOVO` | ID do estágio "Novo Lead" |
| `HUBSPOT_STAGE_CONTATO` | ID do estágio "Contato Enviado" |
| `HUBSPOT_STAGE_EM_CONVERSA` | ID do estágio "Em Conversa" |
| `HUBSPOT_STAGE_QUALIFICADO` | ID do estágio "Qualificado" |
| `HUBSPOT_STAGE_REUNIAO` | ID do estágio "Reunião Agendada" |
| `HUBSPOT_STAGE_FRIO` | ID do estágio "Lead Frio" |

---

## PASSO 7 — Importar workflows no n8n

1. No n8n, acesse: Workflows → Import from File
2. Importar nesta ordem:
   - `wf-sdr-01-inbound.json` — Inbound (conversação + reunião)
   - `wf-sdr-02-outbound.json` — Outbound (primeiro contato)
   - `wf-sdr-03-followup.json` — Follow-up automático
3. **Não ativar ainda** — testar primeiro

---

## PASSO 8 — Testar sem WhatsApp real

### Teste 1: Verificar geração de mensagem outbound

Adicione um lead de teste no HubSpot:
- `dealname`: Clínica do Teste LTDA
- `contato_nome`: João Teste
- `contato_whatsapp`: 5547999999999
- `segmento`: clínica de estética
- `sdr_ponto_dor`: Precisa atrair mais pacientes para novos procedimentos
- `sdr_gancho`: Instagram da clínica tem fotos de baixa qualidade que não refletem os resultados dos procedimentos
- `sdr_estado`: NOVO
- `canal_outbound`: WhatsApp

Depois execute manualmente o WF-SDR-02 no n8n (botão "Execute Workflow"). Veja no log se a mensagem foi gerada corretamente pelo Claude. O WhatsApp pode falhar (número teste), mas você verá a mensagem gerada.

### Teste 2: Simular lead respondendo (webhook)

Execute este comando no terminal para simular uma resposta do lead:

```bash
# Simular mensagem recebida via 360dialog
curl -X POST https://SEU_N8N/webhook/sdr/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "5547999999999",
      "id": "test-msg-001",
      "timestamp": "'$(date +%s)'",
      "text": {"body": "Olá, vi sua mensagem. Pode me contar mais sobre o que vocês fazem?"},
      "type": "text"
    }],
    "contacts": [{"profile": {"name": "João Teste"}, "wa_id": "5547999999999"}]
  }'
```

Verifique no n8n:
1. Workflow foi disparado?
2. Claude gerou resposta JSON?
3. HubSpot foi atualizado?

### Teste 3: Simular interesse em reunião

```bash
curl -X POST https://SEU_N8N/webhook/sdr/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "5547999999999",
      "id": "test-msg-003",
      "timestamp": "'$(date +%s)'",
      "text": {"body": "Gostei do que você descreveu. Quando podemos marcar essa reunião?"},
      "type": "text"
    }],
    "contacts": [{"profile": {"name": "João Teste"}, "wa_id": "5547999999999"}]
  }'
```

Esperado: NOVA propõe horários e muda estado para REUNIAO_PROPOSTA no HubSpot.

### Teste 4: Confirmar reunião

```bash
curl -X POST https://SEU_N8N/webhook/sdr/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "5547999999999",
      "id": "test-msg-004",
      "timestamp": "'$(date +%s)'",
      "text": {"body": "Terça às 14h fica ótimo para mim!"},
      "type": "text"
    }],
    "contacts": [{"profile": {"name": "João Teste"}, "wa_id": "5547999999999"}]
  }'
```

Esperado: Google Meet criado, confirmação enviada, estado → REUNIAO_CONFIRMADA.

---

## Como adicionar leads para o bot trabalhar

### Método 1: Manual (via HubSpot)
1. Criar novo Deal no HubSpot
2. Preencher: `dealname`, `contato_nome`, `contato_whatsapp`, `segmento`
3. Opcional (melhora muito a mensagem): `sdr_gancho` e `sdr_ponto_dor`
4. Definir `sdr_estado` = `NOVO`
5. Pipeline: SDR - Carbon Films
6. O WF-SDR-02 buscará o lead automaticamente às 9h ou 14h

### Método 2: Integração futura
- Formulário no site → webhook → criar deal automaticamente
- Instagram DM → webhook → criar deal

---

## Fluxo completo de um lead

```
YAN adiciona lead no HubSpot (estado: NOVO)
         ↓
WF-SDR-02 roda às 9h/14h
         ↓
NOVA gera mensagem personalizada com Claude
         ↓
Mensagem enviada via WhatsApp
         ↓
HubSpot: NOVO → CONTATO_ENVIADO
         ↓
Lead responde? ────────── NÃO ──────→ D+3: WF-SDR-03 envia follow-up
    │                                        ↓ sem resposta
    │                                 D+7: WF-SDR-03 envia último toque
    │                                        ↓ sem resposta
    │                                 D+14: marcado LEAD_FRIO
    ↓ SIM
WF-SDR-01 recebe mensagem via webhook
         ↓
Claude (NOVA) analisa conversa + histórico
         ↓
     AÇÃO? ──── escalate_yan ──→ alerta Yan + responde lead
       │
       ├── book_meeting ──→ cria Google Meet + confirma reunião
       │
       ├── mark_qualified ──→ atualiza HubSpot + alerta Yan
       │
       ├── mark_cold ──→ encerra no HubSpot
       │
       └── reply ──→ continua conversa → repete o ciclo
```

---

## Capacidades da NOVA (SDR Bot)

| O que faz | Autônomo? |
|-----------|-----------|
| Enviar primeiro contato personalizado | ✅ Sim |
| Responder perguntas sobre serviços | ✅ Sim |
| Qualificar lead (nome, empresa, objetivo) | ✅ Sim |
| Tratar objeções (preço, concorrente, experiência ruim) | ✅ Sim |
| Propor reunião de diagnóstico | ✅ Sim |
| Criar Google Meet e enviar link | ✅ Sim |
| Follow-up automático D+3, D+7 | ✅ Sim |
| Alertar Yan em situações complexas | ✅ Sim |
| Fechar contrato / negociar preço | ❌ Escala para Yan |
| Decisões fora do escopo | ❌ Escala para Yan |

---

## Monitoramento

Verificar diariamente no HubSpot:
- Quantos leads em cada estágio
- Notas dos agentes (NOVA SDR) nas últimas 24h
- Leads marcados como AGUARDANDO_YAN (precisam de ação sua)
- Reuniões confirmadas (REUNIAO_CONFIRMADA)

---

## Troubleshooting

**Workflow não dispara no webhook:**
- Verificar se o workflow está ATIVO no n8n
- Testar URL do webhook no browser (deve retornar 200)
- Verificar se o WhatsApp está enviando para a URL correta

**Claude não retorna JSON válido:**
- Verificar logs do node "Parsear Resposta Claude"
- O código tem fallback para texto puro — a conversa não para
- Verificar `ANTHROPIC_API_KEY` nas variáveis do n8n

**HubSpot não atualiza:**
- Verificar se o token tem os escopos corretos
- Verificar se as propriedades customizadas foram criadas com os nomes exatos
- Verificar logs do node HubSpot no n8n

**Google Meet não é criado:**
- Verificar `GOOGLE_OAUTH_TOKEN` (pode ter expirado)
- Renovar token em: https://oauth2.googleapis.com/token
- Para produção: usar Service Account ao invés de OAuth token temporário
