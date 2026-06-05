# Task: consult-mind-council

**Executado por:** Qualquer agente do social-media-squad
**Quando usar:** Antes de decisoes criticas de estrategia, criacao ou analise

---

## Objetivo

Consultar os 4 especialistas do Mind Council e sintetizar suas perspectivas antes de executar uma tarefa critica. Garante que o output do squad incorpora o melhor pensamento dos maiores profissionais de social media.

## Inputs

```yaml
topic: '[topico ou decisao a consultar]'
task_type: '[estrategia | hook | caption | metricas | calendario | posicionamento | crescimento | distribuicao]'
context: '[contexto do projeto — nicho, objetivo, plataforma]'
```

## Processo de Consulta

### Passo 1: Identificar Especialistas Relevantes

Consulte `data/mind-council-frameworks.yaml` → `task_routing` para identificar quais especialistas sao mais relevantes para o `task_type`.

### Passo 2: Extrair Perspectiva de Cada Especialista

Para cada especialista relevante, responda:

**Rafael Kiso perguntaria:**
- Qual etapa do funil (Descoberta > Consideracao > Conversao > Experiencia > Compartilhamento)?
- Qual formato serve essa etapa? (Reels = descoberta, Carrossel = consideracao, Stories = relacionamento)
- Estamos medindo as metricas certas? (saves, shares, retencao — nao curtidas)
- O conteudo e infotenimento? (informacao + entretenimento)

**Paulo Cuenca perguntaria:**
- Este conteudo faz parte de uma cordilheira ou e um post isolado?
- Temos posicionamento de visao de mundo claro?
- Qual dos 5 tipos de conteudo e esse? (hot topic, posicionamento, educativo, colaborativo, prova social)
- Conseguimos ser rapidos o suficiente com este hot topic?

**Gary Vaynerchuk perguntaria:**
- Nosso ratio jab/right hook esta 80/20?
- Estamos documentando ou criando conteudo roteirizado?
- Em qual plataforma a atencao esta mais barata agora?
- Estamos adaptando para a linguagem nativa de cada plataforma?

**Neil Patel perguntaria:**
- Temos dados para suportar essa decisao?
- Existe um A/B test que poderiamos rodar antes de escalar?
- Estamos otimizando para busca (bio, caption, hashtags, alt text)?
- O objetivo e receita ou popularidade?

### Passo 3: Sintetizar

Produza uma sintese com:
- **Consenso dos especialistas** (o que todos concordam)
- **Tensoes ou trade-offs** (onde eles divergem e por que)
- **Recomendacao final** (qual perspectiva priorizar para este contexto especifico)

## Output

```markdown
## Mind Council — Consulta: [topico]

### Especialistas consultados
- Rafael Kiso: [perspectiva em 1-2 frases]
- Paulo Cuenca: [perspectiva em 1-2 frases]
- Gary Vaynerchuk: [perspectiva em 1-2 frases]
- Neil Patel: [perspectiva em 1-2 frases]

### Consenso
[O que todos concordam]

### Recomendacao
[O que aplicar neste contexto especifico e por que]
```

## Quando NAO consultar o Mind Council

- Tarefas operacionais simples (agendar post ja aprovado, formatar template existente)
- Urgencias com janela < 1h (hot topic imediato — execute primeiro, documente depois)
- Tarefas ja validadas pelo content-strategist com frameworks definidos

## Principios Unificados do Mind Council

Consulte `data/mind-council-frameworks.yaml` → `consensus_principles` para os 10 principios em que todos os 4 especialistas concordam.
