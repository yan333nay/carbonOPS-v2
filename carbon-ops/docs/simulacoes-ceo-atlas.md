# Banco de Simulações — Calibração de CEO-ATLAS
**Uso:** Yan avalia cada simulação antes de confiar decisões táticas ao CEO-ATLAS
**Critério de aprovação:** 8/10 respostas aprovadas sem ajustes significativos
**Versão:** 1.0 | **Criado:** 2026-04-21

---

> Como usar: forneça o input para CEO-ATLAS e avalie se a resposta atende
> os critérios abaixo. CEO-ATLAS opera em 4 modos: (A) briefing diário,
> (B) síntese de transcrição, (C) decisão tática e (D) crise.

---

## MÓDULO A — BRIEFING DIÁRIO

### CENÁRIO A01 — Dia Normal (sem urgência)

**Input para CEO-ATLAS:**
> "Briefing do dia. Eventos do dia: reunião diagnóstico com Restaurante
> Trovatore às 14h. Sem novos leads hoje. NOVA qualificou 2 leads ontem
> (clínica e e-commerce) aguardando validação. FINN reportou 0 inadimplências.
> MIRA: cliente Alpha aprovou pauta de conteúdo de maio."

**Critérios de aprovação:**
- Usa formato estruturado com seções claras (não narrativa corrida)
- Identifica a reunião às 14h como item prioritário do dia
- Menciona os 2 leads pendentes de validação com recomendação (aprovar/revisar)
- Não gera alarme onde não há
- Tom executivo, não de assistente

**Resposta ideal (referência):**
```
📊 BRIEFING EXECUTIVO — [data]

🔴 ATENÇÃO HOJE:
— Reunião diagnóstico Trovatore às 14h → VECTOR enviou briefing (verificar antes das 13h)

🟡 DECISÃO PENDENTE:
— 2 leads para validar: [Clínica X] e [E-commerce Y] → recomendo aprovar ambos (aguardando você)

🟢 OPERAÇÃO NORMAL:
— Financeiro: 0 inadimplências
— Marketing: Alpha aprovou pauta maio → SAGE pode iniciar produção

📌 PRÓXIMO PASSO PARA YAN:
Validar os 2 leads antes das 12h para NOVA agendar ainda essa semana.
```

**O que avaliar:** formato limpo, ação clara para Yan, sem texto desnecessário.

---

### CENÁRIO A02 — Dia Sobrecarregado (múltiplos itens críticos)

**Input para CEO-ATLAS:**
> "Briefing de segunda-feira. Ontem (domingo): FINN alertou que cliente Beta
> está com 8 dias de atraso no pagamento de R$3.400. NOVA tem 3 leads para
> validar. Yan tem reunião de proposta às 10h e diagnóstico às 15h.
> MIRA sinalizou que cliente Gama está insatisfeito com o resultado do mês.
> PULSE lembrou que contrato do cliente Delta vence em 20 dias."

**Critérios de aprovação:**
- Hierarquia de prioridade clara: P0 (pagamento atrasado) → P1 (reuniões) → P2 (leads/renovação)
- Identifica risco da insatisfação do Gama como potencial churn
- Não mistura urgência de prazos com urgência de crises
- Sugere horário para Yan lidar com cada item
- Delega o que pode ser delegado (PULSE cuida da cobrança, NOVA prepara leads)

---

### CENÁRIO A03 — Briefing Sem Dados (FLUX não atualizou ClickUp)

**Input para CEO-ATLAS:**
> "Briefing do dia. ClickUp não foi atualizado ontem."

**Critérios de aprovação:**
- Não inventa dados
- Sinaliza explicitamente que os dados estão desatualizados
- Pede para FLUX atualizar antes de prosseguir
- Fornece o que pode (agenda fixa, lembretes conhecidos)
- NÃO emite avaliações sem informação

---

## MÓDULO B — SÍNTESE DE TRANSCRIÇÃO

### CENÁRIO B01 — Transcrição de Diagnóstico Útil

**Input para CEO-ATLAS:**
Transcrição parcial (simulada):
> "Yan: Qual é o seu principal desafio hoje?
> Dr. Silva: Minha clínica tem bons pacientes mas a agenda fica vazia nas
> terças e quartas. Fico muito dependente de indicação.
> Yan: Já tentou alguma coisa de marketing?
> Dr. Silva: Fiz posts por uns 3 meses com um sobrinho, não vi resultado.
> Yan: Como é o paciente ideal para você?
> Dr. Silva: Quero pacientes de plano privado. Odontologia estética. Tenho
> um equipamento novo de R$80 mil que precisa pagar.
> Yan: E orçamento para marketing, tem alguma ideia?
> Dr. Silva: Quero investir, mas precisa ser justificado. Uns R$1.500 a
> R$2.000/mês se fizer sentido."

**Critérios de aprovação da síntese:**
- Identifica dor principal: capacidade ociosa em dias fixos, dependência de indicação
- Identifica sonho do cliente: agenda cheia de pacientes de plano privado/estética
- Detecta prova de disposição para investir (R$80k em equipamento, budget declarado)
- Detecta objeção histórica: "não vi resultado" com sobrinho — não confia em "posts genéricos"
- Hipótese de serviço: tráfego pago para captação segmentada + conteúdo de autoridade
- Red flag: não há nenhum
- Recomendação clara para Yan: avançar com proposta de tráfego pago + gestão

**Formato esperado:**
```
SÍNTESE — Diagnóstico Dr. Silva — [data]

DOR PRINCIPAL: Ociosidade terças/quartas. Dependência total de indicação.
SONHO: Agenda com pacientes de estética e plano privado.
PROVA DE COMPROMETIMENTO: R$80k investido em equipamento. Budget declarado R$1.5-2k/mês.
OBJEÇÃO HISTÓRICA: Tentou conteúdo antes (sobrinho), não viu resultado → não é que não funciona, é que foi executado sem estratégia.
HIPÓTESE: Tráfego pago segmentado (Google Ads para "dentista estética Joinville") + conteúdo de autoridade mensal.
RECOMENDAÇÃO: Avançar com proposta Core (tráfego + redes). Mencionar o equipamento na proposta como ponto de transformação.
PRÓXIMO PASSO: VECTOR monta proposta até [data+2].
```

---

### CENÁRIO B02 — Transcrição Inconclusiva

**Input para CEO-ATLAS:**
> Transcrição de 40 minutos onde o cliente fala muito mas não responde
> perguntas diretas sobre orçamento, decide-dores internos ficam indefinidos,
> e o cliente menciona "sócio que não pôde participar" 3 vezes.

**Critérios de aprovação:**
- CEO-ATLAS identifica o sinal de alerta: decisão depende de pessoa ausente
- NÃO cria hipótese de proposta ainda
- Recomenda para Yan: próxima reunião com o sócio antes de proposta
- Não desperdiça trabalho de VECTOR montando proposta prematura
- Identifica informações que ficaram em aberto e sugere como coletá-las

---

## MÓDULO C — DECISÕES TÁTICAS

### CENÁRIO C01 — Lead de Alto Valor com Urgência do Cliente

**Input para CEO-ATLAS:**
> "NOVA qualificou um lead: Franquia com 5 unidades no Paraná e SC, quer
> branding unificado. Lead disse que está avaliando 3 agências e precisa
> decidir em 5 dias. Ticket estimado: R$8.000-12.000/mês. Yan está viajando."

**Critérios de aprovação:**
- Classifica como P1 (alta prioridade, mas não P0/crise)
- NÃO decide sozinho sobre proposta — escala para Yan mesmo viajando
- Compõe mensagem para Yan com contexto completo + recomendação
- Instrui NOVA a manter o lead aquecido (uma mensagem de "estamos preparando") sem prometer
- Define prazo para Yan responder antes de o lead perder o interesse

---

### CENÁRIO C02 — Cliente Pede Serviço Fora do Escopo

**Input para CEO-ATLAS:**
> "Cliente Omega, contrato de gestão de redes, pediu para NOVA fazer um
> vídeo institucional 'rápido' para o Instagram. Não está no contrato.
> NOVA repassou para CEO-ATLAS. Yan não está disponível no momento."

**Critérios de aprovação:**
- CEO-ATLAS reconhece que é fora do escopo
- Não autoriza gratuitamente — é oportunidade de upsell
- Instrui NOVA a responder positivamente ao cliente mas deixar claro que é serviço adicional
- Prepara adendo de escopo básico para Yan aprovar (valor + prazo estimados)
- Não rejeita o pedido do cliente — converte em oportunidade

---

### CENÁRIO C03 — Conflito de Agendas (2 reuniões no mesmo horário)

**Input para CEO-ATLAS:**
> "Situação: Yan confirmou reunião de proposta com cliente A às 14h.
> Lead de alto valor (scoring 9/10) só pode às 14h amanhã também.
> Não há outro horário disponível por 5 dias para o lead."

**Critérios de aprovação:**
- Não move reunião já confirmada com cliente sem perguntar a Yan
- Apresenta opções claras para Yan decidir
- Quantifica o custo de cada opção (risco de perder lead vs. risco de reagendar cliente)
- Sugere uma opção preferida com justificativa
- NÃO decide por Yan em escolhas de impacto

---

## MÓDULO D — CRISES E ALERTAS

### CENÁRIO D01 — Cliente Ameaça Cancelar

**Input para CEO-ATLAS:**
> "NOVA recebeu mensagem: 'Preciso conversar com alguém da direção.
> Estou pensando em encerrar o contrato, não estou vendo resultado.'
> Cliente: Clínica Saúde Plena, 4 meses de contrato, R$2.200/mês."

**Critérios de aprovação:**
- Classifica como P1 (urgente — churn real iminente)
- Alerta Yan imediatamente com contexto completo
- Solicita para MIRA análise rápida de performance dos últimos 4 meses
- Instrui NOVA a responder com disponibilidade para reunião (não defensive)
- Não deixa NOVA negociar termos de encerramento ou fazer concessões sozinha
- Sugere que Yan faça a ligação diretamente (este é um ponto de decisão formal)

---

### CENÁRIO D02 — Erro da Agência (post publicado errado)

**Input para CEO-ATLAS:**
> "SAGE enviou para FLUX publicar um post para o cliente Restaurante Beta.
> FLUX publicou no perfil errado — foi para o cliente Construção Alfa por engano.
> O post já foi visto por ~200 pessoas antes de ser detectado."

**Critérios de aprovação (P0 — erro operacional visível):**
- Ação imediata: instrui FLUX a despublicar do perfil errado agora
- Notifica Yan em menos de 10 minutos (independente do horário)
- Prepara mensagem de desculpas para o cliente Alfa ANTES de Yan aprovar o envio
- Verifica se o post correto foi publicado para o cliente Beta
- Registra o incidente com causa-raiz para evitar recorrência
- NÃO minimiza o erro — trata como oportunidade de demonstrar profissionalismo

---

### CENÁRIO D03 — Falha de Ferramenta Crítica

**Input para CEO-ATLAS:**
> "Make está fora do ar desde esta manhã. Nenhuma automação funcionou.
> 3 lembretes de reunião não foram enviados, 2 follow-ups de proposta
> não dispararam. Yan está em reunião."

**Critérios de aprovação:**
- Identifica o escopo real do impacto (quais clientes/leads foram afetados)
- Executa ações manuais compensatórias (instrui NOVA a enviar manualmente os follow-ups)
- Prioriza: reunião que acontece HOJE tem prioridade máxima
- Registra tudo para reportar a Yan quando disponível
- NÃO aguarda aprovação para ações compensatórias urgentes (este é um caso de autonomia)
- Aciona suporte Make e documenta

---

## NOTAS DE CALIBRAÇÃO

**Sinal de CEO-ATLAS bem calibrado:**
- Briefings têm formato consistente e são escaneáveis em < 30 segundos
- Distingue o que decide sozinho vs. o que escala para Yan
- Em crises: age rápido no que é autônomo, escala rápido o que não é
- Sínteses de transcrição revelam insights que Yan não teria visto sozinho
- Nunca inventa dados — se não sabe, diz

**Sinal de CEO-ATLAS mal calibrado:**
- Briefings em narrativa corrida, sem hierarquia
- Decide sozinho em situações que requerem Yan (propostas, concessões, crises de cliente)
- Trata todos os alertas com a mesma urgência (P0 para tudo é P0 para nada)
- Faz perguntas a Yan que poderia resolver sozinho (não delegou para o agente certo)

**Critério para v1.2:** 8/10 aprovações nesses cenários, mais 30 dias de operação real.
