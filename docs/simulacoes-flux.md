# Banco de Simulações — Calibração de FLUX
**Uso:** Yan verifica se o ClickUp está sendo operado corretamente por FLUX
**Critério de aprovação:** 100% de conformidade com as regras de trigger e estrutura
**Versão:** 1.0 | **Criado:** 2026-04-22

---

> FLUX é o agente de memória operacional. Testa se: (A) triggers disparam corretamente,
> (B) estruturas de ClickUp são criadas com todos os campos, (C) escaladas chegam
> aos agentes certos no momento certo.

---

## MÓDULO A — GESTÃO DE LEADS

### CENÁRIO A01 — Novo lead via WhatsApp (FLUX-01)

**Contexto:**
NOVA recebeu a primeira mensagem de um novo lead via WhatsApp às 10h23 de terça-feira:
"Oi, vi vocês no Instagram. Tenho um restaurante em Florianópolis e queria saber sobre os serviços."

**Verificar no ClickUp:**
- [ ] Task criada na lista "Leads em Qualificação"
- [ ] Campos preenchidos: Nome (ou "Lead 22/04" se não identificado), Canal ("WhatsApp"), Data/hora ("22/04 10h23")
- [ ] Texto da primeira mensagem copiado no campo de descrição
- [ ] Status: "Aguardando qualificação NOVA"
- [ ] CEO-ATLAS notificado: "Novo lead entrou — WhatsApp — 22/04 10h23"
- [ ] Nenhum outro campo preenchido sem informação (evitar campos "Desconhecido" genérico)

**Sinal de erro:** Task não criada, campos em branco, CEO-ATLAS não notificado.

---

### CENÁRIO A02 — Lead avança para reunião agendada (FLUX-02)

**Contexto:**
NOVA confirmou reunião com lead "Dr. Carlos Moreira / OdontoFlex" para quinta-feira
às 14h. Atualiza status da task no ClickUp para "Reunião Agendada".

**Verificar:**
- [ ] Evento criado no Google Agenda com título: "Carbon Films x OdontoFlex — Reunião de Diagnóstico"
- [ ] Data e horário corretos: quinta às 14h
- [ ] Link do Google Meet gerado e preenchido no campo do evento
- [ ] Participante Carbon Films adicionado com notificação
- [ ] Link do Meet retornado para NOVA (para adicionar na task e no WhatsApp do lead)
- [ ] PULSE-01 programado para quinta às 13h00
- [ ] PULSE-02 programado para quinta às 13h55
- [ ] Task atualizada com: data da reunião + "Link Meet: [URL]"

**Sinal de erro crítico:** Evento criado sem link do Meet (bloqueia PULSE-02).

---

### CENÁRIO A03 — Lead descartado (limpeza de pipeline)

**Contexto:**
NOVA marcou lead "Paulo Fotógrafo" como descartado por incompatibilidade de budget.

**Verificar:**
- [ ] Task movida de "Leads em Qualificação" para "Leads Descartados"
- [ ] Campo "Motivo do descarte" preenchido: "Budget incompatível — MEI sem capacidade de investimento"
- [ ] Data de descarte registrada
- [ ] Nenhum follow-up programado (PULSE cancelado se havia algum)
- [ ] Task NÃO deletada — apenas movida (histórico preservado)

---

## MÓDULO B — ONBOARDING DE NOVOS CLIENTES

### CENÁRIO B01 — Contrato assinado (FLUX-05) — verificação de estrutura completa

**Contexto:**
FINN registra contrato assinado: cliente "Clínica OdontoFlex / Dr. Carlos Moreira"
no Space Financeiro. Serviço: Gestão de Redes + Tráfego Pago. Início: 01/05.

**Verificar no Space OPERAÇÕES:**
- [ ] Pasta criada: "OdontoFlex — Carbon Films"
- [ ] Subpastas criadas: Onboarding / Execução — Maio 2026 / Relatórios / Histórico
- [ ] Checklist de onboarding criado na pasta "Onboarding" com todos os 19 itens
- [ ] Prazos padrão definidos para cada item do checklist (onboarding deve estar completo até D+14)
- [ ] NOVA notificada: "Enviar e-mail de boas-vindas para Dr. Carlos — OdontoFlex"
- [ ] CEO-ATLAS notificado: "OdontoFlex entrou em operação — onboarding iniciado"

**Verificar no Space FINANCEIRO:**
- [ ] Contrato registrado em "Contratos Ativos" com: cliente, valor mensal, data de início, data de vencimento

**Sinal de erro:** Pasta sem subpastas, checklist faltando itens, CEO-ATLAS não notificado.

---

### CENÁRIO B02 — Item do onboarding bloqueado (acesso não concedido)

**Contexto:**
5 dias após o início do onboarding, o item "Acesso ao Gerenciador de Anúncios Meta"
ainda está sem check. Prazo era D+3.

**Verificar:**
- [ ] FLUX-07 disparou no D+4 (1 dia após vencimento) notificando NOVA
- [ ] NOVA foi instruída a pedir o acesso ao cliente gentilmente
- [ ] CEO-ATLAS foi notificado (entrega ao cliente em risco)
- [ ] Task atualizada: "Follow-up solicitado em [data]"
- [ ] Se chegar D+7 sem resolução: escalar para CEO-ATLAS com alerta mais forte

---

## MÓDULO C — MONITORAMENTO DE TAREFAS

### CENÁRIO C01 — Task de entrega vencendo em 24h (FLUX-07)

**Contexto:**
Task "Calendário editorial de maio — Restaurante Beta" tem prazo para amanhã às 18h.
Status atual: "Em andamento". São 18h de hoje — 24h para o prazo.

**Verificar:**
- [ ] FLUX-07 notifica SAGE (responsável pela task)
- [ ] CEO-ATLAS também notificado (pois é entrega ao cliente)
- [ ] Mensagem de alerta é específica: nome da task, cliente, prazo exato
- [ ] Nenhuma mensagem ao cliente ainda (é alerta interno)

---

### CENÁRIO C02 — Task vencida há 1 dia sem atualização

**Contexto:**
Task "Post de Dia das Mães — Clínica Horizonte" venceu ontem. Status não mudou.
Responsável: SAGE.

**Verificar:**
- [ ] FLUX escalou para CEO-ATLAS: "Task vencida D+1 — [nome] — cliente [Horizonte]"
- [ ] CEO-ATLAS notificado com contexto completo
- [ ] NÃO notifica o cliente ainda — é problema interno primeiro
- [ ] Log registrado na task: "Alerta de atraso escalado para CEO-ATLAS em [data]"

---

### CENÁRIO C03 — Aprovação do cliente pendente há 48h (FLUX-08)

**Contexto:**
Task "Aprovação do calendário editorial de maio — Construtora Atlântico" está
com status "Aguardando aprovação do cliente" há 52 horas.

**Verificar:**
- [ ] FLUX-08 notificou NOVA para follow-up (no limite de 48h)
- [ ] Mensagem de NOVA foi gentil, não cobrança
- [ ] Log: "Follow-up solicitado para aprovação — [data/hora]"
- [ ] Se chegar 72h sem resposta: CEO-ATLAS notificado

---

## MÓDULO D — RELATÓRIOS E FINANCEIRO

### CENÁRIO D01 — Criação de tasks de relatório mensal (FLUX-06)

**Contexto:**
Hoje é dia 25 de abril. Há 3 clientes ativos: OdontoFlex, Trovatore, Construtora Atlântico.

**Verificar para cada cliente:**
- [ ] Task "Relatório Mensal — Abril/2026" criada em cada pasta de cliente
- [ ] Prazo: 05/05/2026
- [ ] Checklist com os 5 itens padrão (SAGE compilou / análise MIRA / revisão / envio / reunião)
- [ ] SAGE notificado para iniciar compilação de dados dos 3 clientes
- [ ] Total: 3 tasks criadas, 3 notificações para SAGE

---

### CENÁRIO D02 — Relatório semanal de saúde operacional (toda segunda-feira)

**Contexto:**
Hoje é segunda-feira. Situação: 1 task atrasada (D+2), 3 tasks vencendo esta semana,
18 tasks no prazo, 4 clientes ativos, 12 tasks abertas, 7 concluídas semana passada.

**Verificar o relatório enviado para CEO-ATLAS:**
```
📋 SAÚDE OPERACIONAL — Semana [N] — [Data]

🔴 ATRASADAS:
- [Task X] — [Cliente Y] — 2 dias atraso

🟡 VENCENDO ESTA SEMANA:
- [Task A] — [Cliente B] — vence [data]
- [Task C] — [Cliente D] — vence [data]
- [Task E] — [Cliente F] — vence [data]

🟢 NO PRAZO:
- 18 tasks em andamento normal

📊 CLIENTES ATIVOS: 4
📋 TAREFAS ABERTAS: 12
✅ CONCLUÍDAS NA SEMANA PASSADA: 7
```
- [ ] Formato exato conforme template
- [ ] Todos os dados corretos
- [ ] Enviado antes das 9h de segunda

---

## VERIFICAÇÃO DE INTEGRIDADE DO CLICKUP

Checar mensalmente (Yan faz isso):

| Item | OK? |
|------|-----|
| Todos os leads descartados estão em "Leads Descartados" (não em Qualificação)? | |
| Todos os clientes ativos têm pasta no Space OPERAÇÕES? | |
| Todos os contratos ativos estão no Space FINANCEIRO com data de vencimento? | |
| Nenhuma task de entrega ao cliente está sem responsável definido? | |
| Renovações dos próximos 30 dias estão na lista correta? | |

**Critério de aprovação de FLUX em produção:**
Checklist completo durante 2 semanas consecutivas sem task perdida ou alerta não disparado.
