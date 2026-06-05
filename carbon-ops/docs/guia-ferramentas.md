# Comparativo de Ferramentas — Carbon Films
**Para decisões 0.2, 0.3 e 0.4 do Checklist**

---

## FERRAMENTA DE TRANSCRIÇÃO (Decisão 0.2)

### Recomendação: Fireflies.ai

**Por que Fireflies:**
- Integração nativa com Google Meet (sem extensão necessária)
- Suporte sólido para Português Brasileiro
- Bot entra na reunião automaticamente quando encontra o link no Google Agenda
- Salva transcrição automaticamente e gera resumo com IA
- Webhook disponível para integrar com Make → ClickUp
- Preço acessível (~$10/mês no plano Pro)

| Ferramenta | Preço/mês | PT-BR | Meet | Bot automático | Webhook |
|-----------|----------|-------|------|---------------|---------|
| **Fireflies.ai** ⭐ | ~$10-19 | ✅ Bom | ✅ Nativo | ✅ | ✅ |
| tl;dv | Free/$20 | ✅ Bom | ✅ Nativo | ✅ | ✅ |
| Tactiq | $8-12 | ✅ Bom | ✅ Extensão Chrome | ❌ | ✅ |
| Notta | $9-18 | ✅ Bom | ✅ via bot | ✅ | ✅ |
| Otter.ai | $10-20 | 🟡 Parcial | ✅ via extensão | ❌ | ✅ |

**Alternativa:** tl;dv — interface mais limpa, plano gratuito para começar testar.

**Como configurar Fireflies:**
1. Criar conta em fireflies.ai
2. Conectar ao Google Agenda (OAuth)
3. Configurar pasta de destino no Google Drive
4. Testar com reunião interna
5. Configurar webhook para Make (ver guia de Make)

---

## PLATAFORMA DE AUTOMAÇÃO (Decisão 0.3)

### Recomendação: Make (ex-Integromat)

**Por que Make:**
- Interface visual intuitiva (mais fácil que n8n)
- Preço acessível (~$9-16/mês para o volume da Carbon Films)
- Conectores nativos para ClickUp, Google, WhatsApp (via 360dialog/Twilio)
- Boa documentação em português
- Suporte a webhooks e API calls customizadas
- Ideal para o volume de automações necessárias

| Ferramenta | Preço/mês | Complexidade | ClickUp | Google | WhatsApp | Recomendação |
|-----------|----------|-------------|---------|--------|----------|-------------|
| **Make** ⭐ | $9-16 | Média | ✅ | ✅ | ✅ via conector | Recomendado |
| Zapier | $20-50 | Baixa | ✅ | ✅ | ✅ | Caro pro volume |
| n8n (cloud) | $20+ | Alta | ✅ | ✅ | ✅ | Requer dev |
| Activepieces | Free/$19 | Média | ✅ | ✅ | 🟡 | Boa alternativa |

**Primeiros cenários para configurar no Make:**
1. Lead WhatsApp → task no ClickUp + notificar Yan
2. Task "Reunião Agendada" no ClickUp → evento Google Agenda + link Meet
3. Nova transcrição no Drive → link na task ClickUp + notificar CEO-ATLAS
4. Proposta sem resposta 48h → acionar PULSE-03
5. Pagamento não confirmado → alerta FINN → notificar Yan
6. Contrato vencendo em 30 dias → task de renovação

---

## WHATSAPP BUSINESS (Decisão 0.4)

### Recomendação: Meta WhatsApp Business API (via 360dialog ou Zenvia)

**Comparativo das opções:**

| Opção | Como funciona | Custo/mês | Complexidade | Risco de ban |
|-------|--------------|-----------|-------------|-------------|
| **API Oficial (360dialog)** ⭐ | Número comercial aprovado pela Meta | R$150-300 + mensagens | Alta (precisa aprovação) | Muito baixo |
| **API Oficial (Zenvia)** | Plataforma BR, suporte em PT | R$200-500 | Média | Muito baixo |
| Evolution API (não oficial) | Self-hosted | ~R$50-100 | Média | **ALTO** |
| Manychat | Plataforma SaaS | ~$15-65 | Baixa | Baixo |

**Por que evitar Evolution API:**
- WhatsApp bane números que usam APIs não oficiais
- Para um negócio que depende do canal para atender leads, o risco é alto demais
- Um ban pode destruir a operação de atendimento

**Recomendação para começar:**
360dialog com número novo dedicado para a Carbon Films.
- Solicitar aprovação da Meta (leva 2-7 dias úteis)
- Número dedicado (não misturar com WhatsApp pessoal)
- Conectar ao Make para automações

**Processo de aprovação Meta:**
1. Criar conta Business Manager na Meta
2. Verificar a empresa (CNPJ necessário)
3. Solicitar acesso à WhatsApp Business API
4. Configurar número via 360dialog/Zenvia
5. Aprovação Meta: 2-7 dias úteis

---

## ANTHROPIC API (Decisão fase 1.5)

**Modelos recomendados por agente:**

| Agente | Modelo | Por quê |
|--------|--------|---------|
| CEO-ATLAS | claude-opus-4-5 | Máxima capacidade estratégica |
| MIRA | claude-sonnet-4-5 | Equilíbrio capacidade/custo |
| FINN | claude-sonnet-4-5 | Análise financeira rigorosa |
| VECTOR | claude-sonnet-4-5 | Raciocínio comercial |
| NOVA | claude-sonnet-4-5 | Fluidez conversacional |
| PULSE | claude-haiku-4-5 | Volume alto, regras simples |
| FLUX | claude-haiku-4-5 | Operacional, baixo raciocínio |
| SAGE | claude-haiku-4-5 | Volume de drafts |

**Estimativa de custo mensal (volume inicial):**
- CEO-ATLAS (Opus): ~$30-60/mês
- C-levels (Sonnet x3): ~$20-40/mês cada
- NOVA (Sonnet): ~$30-50/mês
- Workers (Haiku x3): ~$5-10/mês cada

**Total estimado:** R$300-600/mês dependendo do volume de leads

**Como configurar:**
1. console.anthropic.com → criar conta
2. Billing → adicionar cartão (cartão internacional necessário)
3. API Keys → Create Key
4. Configurar billing alert: R$200/mês como primeiro alerta
5. Guardar API Key em cofre seguro (NUNCA em código ou mensagem)

---

## CONTRATOS DIGITAIS

### Recomendação: D4Sign (BR) ou DocuSign

| Ferramenta | Preço/mês | Validade jurídica BR | Interface PT |
|-----------|----------|---------------------|-------------|
| **D4Sign** ⭐ | R$99-299 | ✅ ICP-Brasil | ✅ |
| DocuSign | ~$25+ | ✅ | 🟡 Parcial |
| ClickSign | R$49-199 | ✅ | ✅ |

**D4Sign** tem melhor custo-benefício para mercado brasileiro e validade
jurídica total com ICP-Brasil.
