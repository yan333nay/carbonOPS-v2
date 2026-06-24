# Setup P09 — Prospecção Ativa (HubSpot + n8n + Claude + WhatsApp)

**Tempo estimado:** 60-90 minutos | **Pré-requisitos:** HubSpot free, n8n ativo, API keys em mãos

---

## PARTE 1 — HubSpot: Pipeline e Propriedades

### 1.1 Criar Pipeline de Prospecção

Em HubSpot: **CRM → Deals → Configurações → Pipelines → Adicionar pipeline**

Nome do pipeline: `Prospecção Ativa (P09)`

Criar os seguintes estágios **nesta ordem** (salve os IDs — você vai precisar deles):

| Estágio | ID para n8n var |
|---------|----------------|
| Pesquisa Pendente (MIRA) | `HUBSPOT_STAGE_PESQUISA` |
| Mensagem Pronta (NOVA) | `HUBSPOT_STAGE_MSG_PRONTA` |
| Aprovado para Envio (Yan) | `HUBSPOT_STAGE_APROVADO` |
| Aguardando Resposta | `HUBSPOT_STAGE_AGUARDANDO` |
| Respondeu com Interesse | *(não precisa de var — Yan gerencia manualmente)* |
| Sem Resposta — Nutrição 90 dias | `HUBSPOT_STAGE_SEM_RESPOSTA` |
| Resposta Negativa | *(manual)* |

**Como encontrar o ID do estágio:**
1. HubSpot → Settings → CRM → Deals → Pipelines
2. Abra o pipeline Prospecção Ativa
3. Clique nos três pontos de um estágio → "Edit stage"
4. O ID aparece na URL: `...stageId=XXXXXX` — anote esse valor

---

### 1.2 Criar Propriedades Customizadas nos Deals

Em HubSpot: **Settings → CRM → Properties → Deals → Create property**

Criar todas as seguintes propriedades:

| Nome interno | Label | Tipo |
|-------------|-------|------|
| `contato_nome` | Nome do Contato | Single-line text |
| `contato_whatsapp` | WhatsApp (com DDI, sem +) | Single-line text |
| `segmento` | Segmento / Nicho | Single-line text |
| `website` | Website | URL |
| `ponto_de_dor` | Ponto de Dor (Yan preenche) | Multi-line text |
| `canal_outbound` | Canal de Abordagem | Dropdown: WhatsApp, Instagram, Email |
| `gancho_mira` | Gancho MIRA (auto) | Multi-line text |
| `ponto_dor_validado` | Ponto de Dor Validado MIRA (auto) | Multi-line text |
| `draft_nova` | Draft NOVA (auto) | Multi-line text |
| `data_ultimo_contato` | Data Último Contato (timestamp ms) | Single-line text |

> **Importante:** `data_ultimo_contato` armazena Unix timestamp em milissegundos (número como string). Não use o tipo Date do HubSpot — use Single-line text para evitar conflitos de fuso horário.

---

### 1.3 Criar Private App no HubSpot (API Token)

Em HubSpot: **Settings → Integrations → Private Apps → Create a private app**

- Nome: `Carbon OPS — n8n`
- Scopes necessários:
  - `crm.objects.deals.read`
  - `crm.objects.deals.write`
  - `crm.objects.contacts.read`
  - `crm.objects.companies.read`
  - `crm.objects.notes.read`
  - `crm.objects.notes.write`
  - `sales-email-read`
  - `timeline`
  - `engagements`

Copie o **Access Token** gerado — vai para `HUBSPOT_TOKEN` nas variáveis do n8n.

---

## PARTE 2 — n8n: Variáveis

Em n8n: **Settings → Variables → Add Variable**

Adicionar todas as seguintes variáveis:

| Nome | Valor | Onde obter |
|------|-------|-----------|
| `HUBSPOT_TOKEN` | pk_... | HubSpot Private App (passo 1.3) |
| `HUBSPOT_STAGE_PESQUISA` | ID do estágio | HubSpot (passo 1.1) |
| `HUBSPOT_STAGE_MSG_PRONTA` | ID do estágio | HubSpot (passo 1.1) |
| `HUBSPOT_STAGE_APROVADO` | ID do estágio | HubSpot (passo 1.1) |
| `HUBSPOT_STAGE_AGUARDANDO` | ID do estágio | HubSpot (passo 1.1) |
| `HUBSPOT_STAGE_SEM_RESPOSTA` | ID do estágio | HubSpot (passo 1.1) |
| `ANTHROPIC_API_KEY` | sk-ant-... | console.anthropic.com |
| `WHATSAPP_API_KEY` | sua chave | 360dialog dashboard |
| `YAN_WHATSAPP` | 5547892227584 | número de Yan (DDI+DDD+número, sem +) |

---

## PARTE 3 — n8n: Importar os Workflows

### Importar na ordem:

1. **WF-P09-A** (`wf-p09-a-mira.json`) — pesquisa MIRA
2. **WF-P09-B** (`wf-p09-b-nova.json`) — envio NOVA
3. **WF-P09-C** (`wf-p09-c-pulse.json`) — sequência PULSE

**Como importar:**
- n8n → Workflows → Import from File → selecione o arquivo .json

**NÃO ative ainda** — teste primeiro.

---

## PARTE 4 — Primeiro Teste

### 4.1 Criar um deal de teste no HubSpot

Criar um deal com:
- **Deal name:** `[TESTE] Empresa XYZ`
- **Pipeline:** Prospecção Ativa (P09)
- **Stage:** Pesquisa Pendente (MIRA)
- **contato_nome:** João Teste
- **contato_whatsapp:** `5547000000000` (número fictício — para não enviar nada)
- **segmento:** Gastronomia
- **website:** `restauranteteste.com.br`
- **ponto_de_dor:** Fotos amadoras no Instagram, menu sem identidade visual
- **canal_outbound:** WhatsApp

### 4.2 Testar WF-P09-A manualmente

1. Abrir WF-P09-A no n8n
2. Clicar em **"Execute workflow"** (botão de play)
3. Verificar:
   - A resposta do HubSpot search retornou 1 deal?
   - O Code node "Extrair Deals" retornou o deal corretamente?
   - O Claude API retornou JSON válido?
   - O HubSpot PATCH atualizou o deal? (verificar no HubSpot se `gancho_mira` foi preenchido e o stage avançou)
4. Se tudo OK: o n8n vai tentar enviar WhatsApp para Yan — `5547892227584` — com o gancho gerado

### 4.3 Verificar resultado no HubSpot

No deal de teste, verificar:
- Stage avançou para "Mensagem Pronta (NOVA)"?
- Campo `gancho_mira` foi preenchido?
- Campo `ponto_dor_validado` foi preenchido?

### 4.4 Avançar para aprovação e testar WF-P09-B

1. No HubSpot, avance manualmente o deal de teste para **"Aprovado para Envio (Yan)"**
2. Execute WF-P09-B manualmente no n8n
3. Verificar:
   - NOVA gerou a mensagem?
   - WhatsApp foi chamado? (como `contato_whatsapp` é fictício, deve retornar erro 4xx — normal)
   - HubSpot atualizou o stage para "Aguardando Resposta"?
   - `data_ultimo_contato` foi preenchido com timestamp?
   - Nota foi criada no deal com a mensagem?

### 4.5 Ativar workflows

Após testes passando:
1. Ativar WF-P09-A (vai rodar a cada 30 min automaticamente)
2. Ativar WF-P09-B (vai rodar a cada 30 min)
3. Ativar WF-P09-C (vai rodar segunda a sexta às 9h)

---

## PARTE 5 — Fluxo Operacional para Yan

### Como usar no dia a dia:

**Início do ciclo mensal (1x/mês):**
1. Identificar 20-30 prospects (ICP: comunicação visual abaixo do potencial)
2. Criar um deal no HubSpot para cada um com os campos básicos preenchidos
3. Definir stage inicial: **Pesquisa Pendente (MIRA)**
4. Aguardar — n8n processa e Yan recebe WhatsApp com o gancho de cada um

**Revisão dos ganchos (MIRA → NOVA):**
- WhatsApp de Yan vai receber `[MIRA]: Pesquisa pronta para [Empresa]...`
- Yan acessa o HubSpot, revisa o gancho no deal
- Se aprovado: avança o stage para **"Aprovado para Envio (Yan)"**
- Se precisar ajuste: edita o campo `gancho_mira` diretamente no deal, depois avança o stage

**Resposta do prospect:**
- Se alguém responder: Yan recebe no WhatsApp e **avança o deal manualmente** para "Respondeu com Interesse"
- O WF-P09-C verifica só deals em "Aguardando Resposta" — ao sair desse stage, PULSE para automaticamente
- NOVA assume a conversa a partir daí (P01 — qualificação)

---

## PARTE 6 — Solução de Problemas Comuns

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| WF-P09-A não encontra deals | ID do stage errado | Verificar `HUBSPOT_STAGE_PESQUISA` nas variáveis |
| Claude retorna erro 400 | Prompt muito longo ou model ID errado | Verificar `ANTHROPIC_API_KEY` e `model: 'claude-sonnet-4-5'` |
| WhatsApp retorna 401 | API key inválida | Verificar `WHATSAPP_API_KEY` no dashboard 360dialog |
| HubSpot PATCH retorna 404 | Deal ID incorreto | Verificar extração do `d.id` no Code node |
| `gancho_mira` fica vazio | Claude não retornou JSON válido | Verificar o log da execução — Code node tem fallback automático |
| WF-P09-C não envia D+3 | `data_ultimo_contato` não foi salvo | Verificar se WF-P09-B salvou o timestamp no deal |
