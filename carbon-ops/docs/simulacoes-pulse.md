# Banco de Simulações — Calibração de PULSE
**Uso:** Yan verifica se os triggers e mensagens de PULSE estão se comportando conforme as regras
**Critério de aprovação:** 100% de conformidade com as regras (PULSE não tem raciocínio próprio — ou segue a regra ou não segue)
**Versão:** 1.0 | **Criado:** 2026-04-22

---

> PULSE é um worker de regras, não de raciocínio. Os testes aqui verificam se
> os triggers disparam no momento certo, se as mensagens corretas são enviadas,
> e se os casos de borda são tratados adequadamente.

---

## MÓDULO A — LEMBRETES DE REUNIÃO

### CENÁRIO A01 — Reunião no horário comercial (deve enviar)

**Contexto:**
Evento no Google Agenda: "Carbon Films x Clínica Horizonte — Reunião de Diagnóstico"
Data: quinta-feira às 14h00
WhatsApp do cliente: cadastrado na task do ClickUp
Link Meet: preenchido no evento

**Verificar:**
- [ ] PULSE-01 disparou às 13h00 (1h antes) com a mensagem exata do template
- [ ] PULSE-02 disparou às 13h55 (5 min antes) com o link do Meet correto
- [ ] Ambos os envios foram logados no ClickUp com data/hora e status de entrega
- [ ] Nenhuma mensagem foi enviada fora do horário útil (8h-19h ✅ para 13h-14h)

**O que verificar na mensagem:**
```
Olá, [Nome]! 👋
Passando para lembrar que em 1 hora temos nossa reunião agendada.
Fico no aguardo. Qualquer imprevisto, é só me avisar aqui.
Até já! — Carbon Films
```
- Nome preenchido corretamente (não "[Nome]" literal)
- Sem alterações no texto do template

---

### CENÁRIO A02 — Reunião às 7h30 (fora do horário útil — NÃO deve enviar PULSE-01)

**Contexto:**
Evento no Google Agenda: reunião agendada para 7h30 de sexta-feira.
Lembrete de 1h antes = 6h30 (fora do horário permitido 8h-19h).

**Comportamento esperado:**
- [ ] PULSE-01 NÃO dispara às 6h30
- [ ] PULSE-01 dispara no início do horário útil (8h00) com mensagem adaptada:
  substituir "em 1 hora" por "esta manhã às 7h30" — ou não enviar (documentar decisão)
- [ ] PULSE-02 dispara normalmente às 7h25 (5 min antes) — *essa é a dúvida:*
  7h25 ainda é fora do horário, portanto NÃO deve enviar também

**Nota para FLUX/Make:** Este é um edge case que precisa de regra explícita.
Se ambos os lembretes caem fora do horário útil, sugerir para Yan que reuniões
antes das 8h15 não recebem lembretes automáticos. Registrar no ClickUp.

---

### CENÁRIO A03 — Link do Meet não preenchido no evento

**Contexto:**
Reunião confirmada para amanhã às 15h. FLUX criou o evento mas o link do Meet
está em branco no campo do Google Agenda.

**Comportamento esperado:**
- [ ] PULSE detecta ausência do link ANTES de programar PULSE-02
- [ ] Alerta FLUX imediatamente: "⚠️ Evento [nome] amanhã às 15h — link do Meet não encontrado. Gerar e preencher antes das 14h55."
- [ ] PULSE-01 envia normalmente (não precisa do link)
- [ ] PULSE-02 fica em standby até FLUX confirmar o link preenchido
- [ ] Se FLUX não preencher antes dos 5 minutos: PULSE-02 não dispara, e CEO-ATLAS é notificado

**Critério crítico:** PULSE-02 jamais envia com campo [LINK_GOOGLE_MEET] em branco.

---

## MÓDULO B — FOLLOW-UP DE PROPOSTAS

### CENÁRIO B01 — D+2 sem resposta (deve enviar PULSE-03)

**Contexto:**
Task "Proposta Enviada" para Restaurante Beta registrada no ClickUp em 20/04 às 10h.
Hoje é 22/04 às 10h30 (D+2). Nenhuma atualização de status na task.

**Comportamento esperado:**
- [ ] PULSE-03 dispara entre 8h e 19h de 22/04
- [ ] Mensagem enviada para o contato registrado na task
- [ ] Log registrado no ClickUp: "PULSE-03 enviado — 22/04 10h30"
- [ ] Task não muda de status (aguarda resposta do lead)

**Verificar:** PULSE não cria expectativa de resposta imediata — é apenas "passando para ver".

---

### CENÁRIO B02 — Lead responde ao PULSE-03 (PULSE para, NOVA assume)

**Contexto:**
PULSE-03 enviado. 30 minutos depois, o lead responde:
"Oi! Sim, vi a proposta. Tenho algumas dúvidas sobre o escopo do tráfego pago."

**Comportamento esperado:**
- [ ] PULSE identifica que o lead respondeu à mensagem
- [ ] PULSE para imediatamente — NÃO responde e NÃO programa PULSE-04
- [ ] NOVA é notificada: "Lead [Nome] respondeu ao follow-up de proposta. Retomar conversa."
- [ ] VECTOR é notificado: "Resposta à proposta — possível abertura para negociação"
- [ ] Log no ClickUp: "Lead respondeu — NOVA assumiu em [data/hora]"

**Critério crítico:** PULSE nunca responde a mensagens — só envia triggers.

---

### CENÁRIO B03 — D+7 sem resposta (deve enviar PULSE-04 + notificar VECTOR)

**Contexto:**
Proposta enviada há 7 dias. PULSE-03 foi enviado no D+2 e não houve resposta.
Hoje é D+7.

**Comportamento esperado:**
- [ ] PULSE-04 dispara com a mensagem do template (incluindo [DATA_VALIDADE] correta — D+15 da proposta)
- [ ] VECTOR é notificado: "Proposta [Nome] sem resposta em D+7. Avaliar ajuste de estratégia."
- [ ] Log no ClickUp atualizado
- [ ] PULSE não programa mais follow-ups além do D+7 (regra de 2 mensagens máximo)

**Verificar:** A [DATA_VALIDADE] na mensagem é preenchida automaticamente,
não enviada como texto literal.

---

### CENÁRIO B04 — Proposta fechada antes do D+7 (PULSE-04 não deve disparar)

**Contexto:**
Proposta enviada em D+0. Em D+4, o cliente confirma o fechamento e a task
avança para status "Contrato Assinado".

**Comportamento esperado:**
- [ ] PULSE cancela o PULSE-04 programado para D+7
- [ ] PULSE cancela qualquer follow-up remanescente para esse lead
- [ ] Nenhuma mensagem de follow-up enviada após o fechamento

**Critério crítico:** PULSE não envia follow-up de proposta para cliente que já fechou.

---

## MÓDULO C — REATIVAÇÃO E PÓS-ENCERRAMENTO

### CENÁRIO C01 — Ex-cliente com 90 dias (PULSE-05)

**Contexto:**
Contrato do cliente Construção Alfa encerrou em 22/01. Hoje é 22/04 (90 dias).
Permissão de contato registrada como "SIM" no encerramento no ClickUp.

**Comportamento esperado:**
- [ ] PULSE-05 dispara com a mensagem de reativação
- [ ] Usa WhatsApp se disponível, e-mail como fallback
- [ ] Menciona "[Empresa]" corretamente preenchido
- [ ] Log registrado no ClickUp
- [ ] NOVA é notificada que mensagem de reativação foi enviada

---

### CENÁRIO C02 — Ex-cliente SEM permissão de contato (PULSE-05 bloqueado)

**Contexto:**
Encerramento foi registrado com permissão de contato = "NÃO".
90 dias se passaram.

**Comportamento esperado:**
- [ ] PULSE-05 NÃO dispara
- [ ] Log registrado: "PULSE-05 bloqueado — permissão de contato: NÃO"
- [ ] PULSE não tenta canais alternativos

---

### CENÁRIO C03 — NPS pós-encerramento D+7 (PULSE-06)

**Contexto:**
Contrato encerrado há 7 dias. Encerramento foi amigável (sem conflito registrado).

**Comportamento esperado:**
- [ ] PULSE-06 dispara no D+7 do encerramento
- [ ] Mensagem enviada via WhatsApp com pergunta de NPS
- [ ] Log registrado
- [ ] Se cliente responder com NPS: NOVA assume para agradecer e registrar o score

---

## REGRAS GERAIS — VERIFICAÇÃO DE CONFORMIDADE

Para cada execução de PULSE, verificar:

| Regra | Sim/Não |
|-------|---------|
| Mensagem enviada dentro do horário útil (seg-sex 8h-19h / sáb 9h-13h)? | |
| Máximo 2 mensagens no mesmo dia para o mesmo contato? | |
| Template usado sem alterações de conteúdo? | |
| Log registrado no ClickUp com data/hora e status? | |
| Escalada feita quando necessário (NOVA, VECTOR, CEO-ATLAS)? | |

**Critério de aprovação de PULSE em produção:**
Todos os cenários acima com conformidade 100%. PULSE não tem "quase certo" —
ou a regra foi seguida ou houve falha de configuração.
