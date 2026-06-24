# Runbook de Operação Diária — Carbon Films
**Para uso de:** Yan e Joel
**Tempo estimado:** 5-15 minutos por dia

---

## CHECKLIST DIÁRIO (8h — antes de começar o dia)

CEO-ATLAS envia automaticamente o Briefing Diário. Você lê e age nos itens 🔴.

```
[ ] Ler o Briefing Diário de CEO-ATLAS (chegará no WhatsApp ou e-mail)
[ ] Resolver itens 🔴 REQUER AÇÃO IMEDIATA
[ ] Verificar se há aprovações pendentes de Yan no ClickUp
[ ] Verificar se algum cliente está aguardando resposta sua há mais de 4h
```

---

## APROVAÇÕES QUE SÓ YAN FAZ

Estes itens ficam na fila de "Aguardando Yan" no ClickUp. Checar 1x ao dia:

| O que aprovar | Onde fica | Prazo máximo |
|--------------|-----------|-------------|
| Lead avançar para reunião | ClickUp → COMERCIAL → Leads em Qualificação | 2h após notificação |
| Proposta para envio ao cliente | ClickUp → COMERCIAL → Propostas em Produção | Dentro do prazo combinado com o lead |
| Plano de ação mês 1 (novo cliente) | ClickUp → OPERAÇÕES → [Cliente] → Onboarding | Antes da reunião de apresentação |
| Contrato para assinatura | E-mail D4Sign | Dentro do prazo da proposta |
| Decisão financeira relevante | WhatsApp FINN ou ClickUp → FINANCEIRO | Conforme urgência |

---

## COMO VERIFICAR A SAÚDE DO SISTEMA EM 5 MINUTOS

```
1. Abra o ClickUp
   → COMERCIAL: há leads "Aprovado p/ Reunião" esperando há mais de 2h? → Agir
   → OPERAÇÕES: há tarefas vencidas com ⚠️? → Verificar com responsável
   → FINANCEIRO: há inadimplências? → Verificar com FINN

2. Verifique o Make
   → Há cenários com ícone de erro (❌)? → Ver runbook de emergência item 5

3. Verifique o WhatsApp da agência
   → Há mensagem de cliente sem resposta de NOVA há mais de 2h úteis? → Intervir
```

---

## ROTINA SEMANAL (segunda-feira, ~20 min)

```
[ ] Ler relatório semanal de FLUX (chega segunda 8h)
[ ] Ler análise de padrões de VECTOR (leads perdidos da semana)
[ ] Revisar 10 últimas conversas de NOVA (shadowing)
    → Houve resposta inadequada? → Corrigir prompt e versionar
[ ] Confirmar que todas as reuniões da semana têm MSG-04/05 programadas
[ ] Verificar renovações vencendo nos próximos 30 dias (ClickUp → FINANCEIRO)
```

---

## ROTINA MENSAL (dia 25-30)

```
[ ] Dia 25: SAGE inicia compilação de dados de todos os clientes
[ ] Dia 28: Revisar rascunhos de relatório gerados pelo CEO-ATLAS
[ ] Dia 30 (ou dia 5 do próximo mês): Apresentar relatórios mensais
[ ] Dia 5 do mês: Relatório financeiro de FINN — ler e assinar
[ ] Durante o mês: Identificar clientes prontos para upsell de esteira
```

---

## COMO PAUSAR UM AGENTE EM EMERGÊNCIA

**Para pausar NOVA (atendimento):**
1. Acesse Make → Cenários → "Lead WhatsApp → NOVA"
2. Toggle off (desativar o cenário)
3. Assuma o atendimento manualmente
4. Reative após resolver o problema

**Para pausar PULSE (lembretes automáticos):**
1. Make → Cenários → "PULSE-01" e "PULSE-02"
2. Toggle off ambos
3. Envie os lembretes manualmente se necessário
4. Reative

**Para pausar FLUX (ClickUp automático):**
1. Make → Cenários → todos que começam com "FLUX-"
2. Toggle off
3. Atualize o ClickUp manualmente
4. Reative

---

## COMO ADICIONAR UM NOVO CLIENTE MANUALMENTE

Se por alguma razão o FLUX não criou a estrutura automaticamente:

```
1. ClickUp → OPERAÇÕES → New Folder → [Nome do Cliente]
2. Criar listas: Onboarding / Execução — Mês Atual / Relatórios / Histórico
3. Abrir lista Onboarding → importar checklist de templates/checklist-onboarding.md
4. ClickUp → FINANCEIRO → Contratos Ativos → New Task → preencher campos
5. Google Drive → 01_Clientes → New Folder → [Nome do Cliente]
   Criar subpastas: 01_Contrato / 02_Briefing / 03_Estratégia / 04_Conteúdo / 05_Relatórios / 06_Assets
6. Compartilhar a pasta do Drive com o cliente (permissão de visualização)
```

---

## COMO VERIFICAR SE CEO-ATLAS PROCESSOU A TRANSCRIÇÃO

Após uma reunião:
1. Verifique se a transcrição aparece no Drive (pasta do cliente → 02_Briefing → Transcrições)
2. Verifique se o link aparece na task do ClickUp (campo "Transcrição")
3. Verifique se CEO-ATLAS gerou o rascunho da Ficha de Diagnóstico (deve aparecer como comentário na task)
4. Se qualquer um dos 3 não aconteceu em até 30 min após o fim da reunião → checar Make (cenário FLUX-03)

---

## GLOSSÁRIO RÁPIDO — O QUE CADA AGENTE FAZ

| Agente | Você interage quando... |
|--------|------------------------|
| CEO-ATLAS | Precisa de síntese estratégica, briefing diário, ou processamento de transcrição |
| NOVA | Quer ver/corrigir o atendimento de leads |
| VECTOR | Quer entender por que leads estão sendo perdidos |
| MIRA | Quer feedback sobre estratégia de conteúdo de um cliente |
| FINN | Precisa de status financeiro ou alerta de inadimplência |
| PULSE | Precisa verificar se lembretes estão sendo enviados |
| FLUX | Precisa verificar se tarefas estão sendo criadas corretamente |
| SAGE | Quer revisar drafts de conteúdo antes de MIRA |
