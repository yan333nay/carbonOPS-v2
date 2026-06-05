# Banco de Simulações — Calibração de FINN
**Uso:** Yan avalia cada simulação antes de confiar o monitoramento financeiro ao FINN
**Critério de aprovação:** 8/10 respostas aprovadas sem ajustes significativos
**Versão:** 1.0 | **Criado:** 2026-04-22

---

> Como usar: forneça o contexto para FINN e avalie se a resposta atende os critérios.
> FINN opera em 4 modos: (A) alertas de inadimplência, (B) relatório mensal,
> (C) análise de renovação, (D) análise de concentração de receita.

---

## MÓDULO A — ALERTAS DE INADIMPLÊNCIA

### CENÁRIO A01 — Primeira Ocorrência (D+1)

**Input para FINN:**
> "Cliente Clínica Horizonte — pagamento de R$2.800 venceu ontem (D+1)
> e não foi confirmado. Contrato: gestão de redes há 5 meses.
> Histórico: sempre pagou em dia."

**Critérios de aprovação:**
- Classifica como D+1 — alerta interno apenas, NÃO aciona Yan ainda
- Tom do alerta: informativo, sem alarme
- Instrui FLUX a criar task de monitoramento no ClickUp
- NÃO instrui NOVA a contatar o cliente ainda
- Prevê próxima ação em D+3 se não regularizar

**Resposta ideal (referência):**
```
⚠️ PAGAMENTO EM ATRASO — Clínica Horizonte — R$2.800 — venceu em [data]
Status: D+1 | Histórico: pagador pontual (5 meses)

Ação D+1: Monitoramento interno. Histórico limpo — provavelmente atraso bancário.
Próximo passo: Se não confirmado até D+3, NOVA envia mensagem gentil.
FLUX: criar task "Pagamento Horizonte — monitorar D+3".
Yan: sem ação necessária hoje.
```

**Red flag que FINN NÃO deve fazer:** mandar NOVA cobrar no D+1, escalar para Yan sem necessidade.

---

### CENÁRIO A02 — Inadimplência Reincidente (D+3)

**Input para FINN:**
> "Restaurante Beta — R$1.900 vencidos há 3 dias (D+3).
> Histórico: já atrasou 2 vezes nos últimos 4 meses (D+5 e D+4).
> Cliente está ativo no serviço de gestão de redes."

**Critérios de aprovação:**
- Identifica o padrão de reincidência como fator de risco aumentado
- Instrui NOVA a enviar mensagem gentil (template cobrança-gentil)
- Inclui no próximo briefing para Yan com contexto de reincidência
- Avalia implicitamente o risco: cliente com padrão de atraso tem LTV comprometido
- NÃO corta o serviço ainda — não é D+15

**Avaliação adicional:** FINN deve identificar que 3 atrasos em 4 meses = padrão, não exceção.
Na análise, deve mencionar esse padrão para Yan avaliar na renovação.

---

### CENÁRIO A03 — Inadimplência Grave (D+7)

**Input para FINN:**
> "Construtora Paragon — R$6.400 em atraso há 7 dias (D+7).
> É o maior cliente da agência (35% do MRR).
> Não respondeu à mensagem de NOVA no D+3.
> Contrato tem mais 4 meses."

**Critérios de aprovação:**
- Classifica como P1 — acionar Yan no mesmo dia
- Destaca a concentração de receita: 35% do MRR = acima do limite de 30%
- Calcula o impacto real: R$6.400 mais os próximos meses em risco se encerrar
- Prepara o relatório de impacto financeiro para Yan decidir ação
- Sugere opções para Yan: ligação direta, pausa do serviço, notificação formal
- NÃO decide a ação — escala com dados completos

**Formato esperado de relatório de impacto:**
```
🔴 RELATÓRIO DE IMPACTO — Construtora Paragon — D+7

VALOR EM ATRASO: R$6.400
EXPOSIÇÃO TOTAL (contrato restante): R$6.400 × 4 meses = R$25.600
CONCENTRAÇÃO: 35% do MRR (acima do limite de 30%)

RISCO:
- Se pagar hoje: impacto zero além do atraso
- Se não pagar em D+15: decisão de suspensão necessária
- Se encerrar o contrato: perda de 35% do MRR imediato

RECOMENDAÇÃO: Yan ligar diretamente. Cliente de alto valor merece atenção pessoal,
não apenas mensagem automática.

OPÇÕES PARA YAN:
1. Ligação hoje + acordo de parcelamento
2. Notificação formal via D4Sign (último recurso)
3. Aguardar mais 3 dias e reavaliar
```

---

### CENÁRIO A04 — Cliente Quer Parcelar o Atraso

**Input para FINN:**
> "Cliente Omega pediu para pagar o atraso de R$4.200 em 3x
> (R$1.400 agora + R$1.400 em 30 dias + R$1.400 em 60 dias).
> NOVA repassou o pedido."

**Critérios de aprovação:**
- FINN não concede sozinho — escala para Yan com análise
- Apresenta análise: risco do parcelamento vs. risco de perder o cliente
- Calcula: mensalidade do contrato + parcelas sobrepostas = carga financeira do cliente
- Avalia historico: se é primeira ocorrência, parcelamento pode ser viável
- Se concede parcelamento, define condição: suspensão do serviço em caso de novo atraso

---

## MÓDULO B — RELATÓRIO FINANCEIRO MENSAL

### CENÁRIO B01 — Mês Estável (testar formato)

**Input para FINN:**
> "Gerar relatório financeiro de abril. Dados:
> MRR atual: R$18.400 (era R$16.200 em março).
> Churn: 0. Inadimplências ativas: R$2.800 (Horizonte, D+3).
> Contrato vencendo: cliente Delta em 18 dias.
> Distribuição: maior cliente = 28% do MRR.
> Projeção maio: R$18.400 (sem novas vendas confirmadas)."

**Critérios de aprovação:**
- Usa formato estruturado com todos os campos definidos no prompt
- Calcula a variação corretamente: +13,6% MRR vs. março
- Identifica Delta como atenção (renovação em 18 dias)
- Identifica Horizonte como monitoramento (D+3)
- Projeção conservadora (sem assumir fechamentos não confirmados)
- Seção de oportunidade: crescimento de 13,6% é dado positivo a destacar
- Tamanho: conciso, não mais que necessário

**Formato esperado (referência):**
```
📊 RELATÓRIO FINANCEIRO — Abril/2026

MRR ATUAL: R$18.400 (+13,6% vs. março | +R$2.200)
PROJEÇÃO MAIO: R$18.400 (estável — nenhum novo contrato confirmado)
ARR PROJETADO: R$220.800

🔴 ATENÇÃO:
— Inadimplência Horizonte: R$2.800 (D+3) — NOVA enviou mensagem gentil, aguardando

🟡 MONITORAR:
— Contrato Delta vence em 18 dias — iniciar renovação esta semana

💡 OPORTUNIDADE:
— Crescimento de 13,6% MRR vs. março — analisar o que trouxe esse crescimento para replicar
— Nenhum cliente acima de 30% de concentração (maior = 28%) ✅

📈 EVOLUÇÃO 6 MESES:
Nov: R$-- | Dez: R$-- | Jan: R$-- | Fev: R$-- | Mar: R$16.200 | Abr: R$18.400
```

---

### CENÁRIO B02 — Mês com Problemas (teste de clareza)

**Input para FINN:**
> "Relatório maio. MRR: R$16.100 (era R$18.400 em abril).
> Churn: cliente Paragon encerrou — representava R$3.800/mês.
> Nova venda: cliente Ecosul R$1.500/mês.
> 2 inadimplências ativas totalizando R$5.200.
> Reserva operacional: 2,1 meses de custo."

**Critérios de aprovação:**
- Identifica o churn líquido: -R$2.300 no MRR (não só o churn bruto)
- Alerta sobre reserva: 2,1 meses está no limite (regra: mínimo 3 meses)
- Apresenta o dado claramente sem minimizar
- Calcula: para voltar ao MRR de abril, precisa fechar R$2.300 em novas vendas
- Não suaviza os números — "clareza radical"
- Sugere ação concreta para cada problema

---

## MÓDULO C — ANÁLISE DE RENOVAÇÃO

### CENÁRIO C01 — Cliente Estratégico para Renovar

**Input para FINN:**
> "Contrato cliente Alpha vence em 28 dias.
> LTV acumulado: R$22.000 (10 meses).
> Histórico: sem atrasos, feedbacks positivos.
> Serviço atual: gestão de redes R$2.200/mês."

**Critérios de aprovação:**
- Alerta Yan com contexto completo: LTV, histórico, data de vencimento
- Calcula o potencial de expansão: LTV atual vs. projeção com upsell
- Recomendação com justificativa: renovar no mesmo escopo OU propor expansão
- Se propor expansão: qual serviço faz sentido como próximo passo
- Prepara briefing para CEO-ATLAS apresentar renovação (não apenas alerta)

**Avaliação:** FINN deve pensar como "quero que esse cliente fique" — não apenas disparar alerta automático.

---

### CENÁRIO C02 — Cliente em Risco de Não Renovar

**Input para FINN:**
> "Contrato Restaurante Gamma vence em 15 dias.
> LTV: R$7.200 (4 meses a R$1.800/mês).
> Histórico: 1 atraso de pagamento, 2 pedidos de mudança de escopo não atendidos,
> NOVA registrou que o cliente 'estava resmungando' na última conversa."

**Critérios de aprovação:**
- Classifica como renovação em risco (não automática)
- Identifica sinais: 3 indicadores de insatisfação
- Não recomenda renovar no mesmo formato — algo está errado
- Escala para Yan ANTES do vencimento com análise completa
- Sugere: Yan ou CEO-ATLAS fazer contato proativo antes de propor renovação
- Calcula o custo de perder vs. custo de resolver o problema

---

## MÓDULO D — CONCENTRAÇÃO DE RECEITA

### CENÁRIO D01 — Alerta de Concentração

**Input para FINN:**
> "Acabou de fechar um contrato grande: cliente Indústria Mega, R$8.500/mês.
> MRR após esse fechamento: R$26.900.
> Indústria Mega representa 31,6% do MRR."

**Critérios de aprovação:**
- Alerta imediatamente: ultrapassou o limite de 30%
- Calcula: 31,6% vs. limite de 30% = R$430 acima do limite (pouco, mas acima)
- Contexto: não é crise, mas exige atenção estratégica
- Recomendação: não rejeitar o cliente (absurdo), mas acelerar aquisição de outros clientes
- Sugere a Yan: incluir diversificação de receita como meta de Q2
- NÃO causa pânico — contextualiza o risco real

---

### CENÁRIO D02 — Simulação de Perda do Maior Cliente

**Input para FINN:**
> "Yan pediu: se perdermos o cliente Construtora Atlântico
> (32% do MRR = R$5.800/mês), como ficamos?
> Reserva atual: R$41.000 (3,8 meses de custo)."

**Critérios de aprovação:**
- Faz o cálculo de impacto claramente: MRR cai X%, reserva cobre Y meses sem o cliente
- Calcula o "runway" para substituir a receita perdida
- Identifica quais custos são fixos vs. variáveis (o que pode ser cortado se necessário)
- Apresenta cenário otimista (substituem em 2 meses) e conservador (3+ meses)
- NÃO minimiza o risco — FINN trabalha com cenários reais

---

## NOTAS DE CALIBRAÇÃO

**Sinal de FINN bem calibrado:**
- Protocolo de inadimplência seguido à risca (D+1, D+3, D+7 com ações distintas)
- Relatórios com dados reais, não arredondamentos otimistas
- Concentração de receita monitorada proativamente
- Escala para Yan com dado + análise + opções (não apenas "tem um problema")
- Distingue urgência real de urgência aparente

**Sinal de FINN mal calibrado:**
- Alerta Yan no D+1 de qualquer inadimplência (gera ruído)
- Escala sem análise ("tem um atraso, o que faço?")
- Minimiza ou suaviza dados negativos
- Não identifica padrões (trata cada atraso como evento isolado)

**Critério para v1.2:** Após 3 ciclos mensais reais + banco de decisões de Yan preenchido.
