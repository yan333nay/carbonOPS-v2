# PULSE — Regras de Automação e Mensagens
**Versão:** 1.1 | **Tipo:** Agente Worker | **Atualizado:** 2026-04-29
**Mudanças v1.1:** Adicionado protocolo de identificação obrigatória (`[PULSE]: mensagem`), cenários MSG-OUT-04 (follow-up outbound D+3) e MSG-OUT-05 (breakup D+7).

---

> PULSE não é um agente de raciocínio — é um conjunto de regras de automação
> com mensagens pré-aprovadas. Ele executa com timing preciso e escala para
> NOVA ou VECTOR quando a situação exige raciocínio contextual.

## PROTOCOLO DE IDENTIFICAÇÃO (OBRIGATÓRIO)

Toda mensagem enviada por PULSE deve iniciar com:

> `[PULSE]: mensagem`

Toda notificação interna enviada ao WhatsApp de Yan deve iniciar com:

> `[FLUX]: mensagem` (quando disparada por FLUX) ou `[PULSE]: mensagem`

---

---

## CENÁRIOS DE AUTOMAÇÃO

### PULSE-01: Lembrete 1 hora antes (MSG-04)
**Trigger:** 60 minutos antes de qualquer evento de reunião no Google Agenda
  da Carbon Films que tenha contato de WhatsApp do cliente
**Canal:** WhatsApp
**Executa:** Automaticamente, sem aprovação

**Mensagem:**
```
[PULSE]: Olá, [Nome]! 👋

Passando para lembrar que em 1 hora temos nossa reunião agendada.

Fico no aguardo. Qualquer imprevisto, é só me avisar aqui.

Até já! — Carbon Films
```

---

### PULSE-02: Lembrete 5 minutos antes com link (MSG-05)
**Trigger:** 5 minutos antes do evento de reunião no Google Agenda
**Canal:** WhatsApp
**Executa:** Automaticamente, sem aprovação
**Requer:** Link do Google Meet no campo do evento do Google Agenda

**Mensagem:**
```
[PULSE]: [Nome], nossa reunião começa em 5 minutinhos! 🎯

Aqui está o link para entrar: [LINK_GOOGLE_MEET]

Te vejo já! — Carbon Films
```

**Alerta para FLUX se:** O link do Meet não estiver preenchido no evento
(prevenir MSG-05 quebrada).

---

### PULSE-03: Follow-up de proposta D+2
**Trigger:** 48 horas após registro de "Proposta Enviada" no ClickUp sem
  atualização de status
**Canal:** WhatsApp
**Executa:** Automaticamente
**Escalada:** Se lead não responder, registrar no ClickUp e notificar VECTOR

**Mensagem:**
```
[PULSE]: Olá, [Nome]! 😊

Passando para ver se você teve tempo de dar uma olhada na proposta que
enviamos. Fico à disposição para esclarecer qualquer dúvida!

— Carbon Films
```

---

### PULSE-04: Follow-up de proposta D+7
**Trigger:** 7 dias após envio de proposta sem resposta (nenhuma no D+2 também)
**Canal:** WhatsApp
**Executa:** Automaticamente
**Ação paralela:** Notificar VECTOR para avaliar ajuste de estratégia

**Mensagem:**
```
[PULSE]: Oi [Nome]! Sei que a rotina pega pesado 😄

Só passando para deixar nosso contato em aberto. Se quiser conversar
sobre a proposta, ajustar algum ponto ou tirar dúvidas, é só responder aqui.

A proposta fica válida até [DATA_VALIDADE].

— Carbon Films
```

---

### PULSE-05: Reativação de ex-cliente (3 meses)
**Trigger:** 90 dias após registro de encerramento de contrato no ClickUp
**Canal:** WhatsApp (ou e-mail se WhatsApp não disponível)
**Executa:** Automaticamente
**Requer:** Permissão de contato registrada no encerramento

**Mensagem WhatsApp:**
```
[PULSE]: Oi [Nome]! Tudo bem? Aqui é NOVA, da Carbon Films. 😊

Faz um tempo que encerramos nossa parceria e queria saber como estão as coisas
aí na [Empresa].

Temos algumas novidades que podem ser interessantes para o momento de vocês.
Se quiser bater um papo rápido, é só me dizer!

— Carbon Films
```

**Mensagem E-mail (assunto: Carbon Films — Como estão as coisas na [Empresa]?):**
```
Olá, [Nome]!

Passaram alguns meses desde que encerramos nossa parceria e queríamos
dar um alô para saber como as coisas estão por aí.

Temos trabalhado em algumas novas abordagens que podem fazer sentido
para o momento atual da [Empresa]. Se quiser bater um papo rápido,
fico feliz em marcar um horário.

Um abraço,
NOVA — Carbon Films
```

---

### PULSE-06: Check-in pós-encerramento (D+7)
**Trigger:** 7 dias após encerramento de contrato
**Canal:** WhatsApp
**Objetivo:** Solicitar feedback/NPS enquanto a experiência está fresca

**Mensagem:**
```
[PULSE]: Oi [Nome]! Passando para agradecer mais uma vez pela nossa parceria. 🙏

Me conta, de 0 a 10, qual a chance de você indicar a Carbon Films
para alguém que precise de marketing?

Qualquer feedback é bem-vindo — ajuda muito a gente a melhorar!

— Carbon Films
```

---

### MSG-OUT-04: Follow-up outbound D+3
**Trigger:** 3 dias após NOVA enviar o primeiro contato outbound (MSG-OUT-01/02/03) sem resposta
**Canal:** Mesmo canal do primeiro contato
**Executa:** Automaticamente, disparado por WF-06 no n8n
**Escalada:** Se houver resposta, NOVA assume imediatamente

**Mensagem:**
```
[PULSE]: Olá, [Nome]! Passei aqui para ver se você teve chance de ler minha
mensagem anterior sobre [gancho personalizado].

Fico à disposição para uma conversa rápida quando fizer sentido para você.

— Carbon Films
```

---

### MSG-OUT-05: Breakup outbound D+7
**Trigger:** 7 dias após primeiro contato outbound sem nenhuma resposta (inclusive após MSG-OUT-04)
**Canal:** Mesmo canal do primeiro contato
**Executa:** Automaticamente — é a última mensagem da sequência
**Após envio:** Registrar como "Sem resposta" no ClickUp + programar PULSE-05 em 90 dias

**Mensagem:**
```
[PULSE]: [Nome], última mensagem aqui — não quero incomodar.

Se no futuro a comunicação visual de [Empresa] entrar na agenda,
a Carbon Films estará aqui.

Sucesso no trabalho de vocês!

— Carbon Films
```

---

## REGRAS DE OPERAÇÃO DE PULSE

**O que PULSE NUNCA faz:**
- ❌ NUNCA adapta o conteúdo das mensagens (usa exatamente o template aprovado)
- ❌ NUNCA envia mensagem fora do horário útil: segunda a sexta 8h-19h, sábado 9h-13h
- ❌ NUNCA envia mais de 2 mensagens no mesmo dia para o mesmo contato
- ❌ NUNCA envia MSG-03 (agendamento) — essa é função de NOVA, que requer raciocínio
- ❌ NUNCA responde perguntas — todas as respostas vão para NOVA

**Quando PULSE escala para NOVA:**
- Se o lead responder qualquer uma das mensagens de PULSE → NOVA assume a conversa
- Se o evento de reunião for cancelado → NOVA trata o cancelamento

**Quando PULSE escala para VECTOR:**
- Proposta sem resposta após D+7 → VECTOR analisa se há ajuste de estratégia

**Log obrigatório no ClickUp:**
Toda mensagem enviada por PULSE deve ser registrada na task correspondente com:
- Data/hora de envio
- Canal
- Tipo de mensagem (PULSE-01 a PULSE-06)
- Status de entrega (enviado/erro)

---

## HISTÓRICO DE VERSÕES

- v1.0 (2026-04-16): Versão inicial criada por Claude Code
- v1.1 (2026-04-29): Adicionado protocolo de identificação `[PULSE]:` em todas as mensagens; adicionado MSG-OUT-04 (follow-up outbound D+3) e MSG-OUT-05 (breakup outbound D+7) para P09
