# quality-inspector-final-gate

## Task Identity

- **Agent:** quality-inspector (Vera)
- **Command:** `*final-gate`
- **Version:** 1.0.0
- **Category:** quality-control

## Purpose

Avaliação completa e veredicto final de um pacote de conteúdo antes de publicação. Esta task executa as 5 dimensões de avaliação, calcula o score ponderado e emite o veredicto APPROVED ou REJECTED com feedback estruturado.

## Prerequisites

- Pacote de produção completo (imagem/vídeo + copy + caption + hashtags)
- Briefing original disponível (data/current-idea.json ou equivalente)
- Brandbook Carbon Films carregado (data/brandbook-carbon-films.yaml)

## Input

```yaml
required:
  - production_package: 'path para o arquivo final (imagem ou vídeo)'
  - copy_package:
      hook: 'texto do hook principal'
      body: 'corpo da copy (slides ou texto)'
      caption: 'legenda completa do post'
      hashtags: [lista de hashtags]
      cta: 'call-to-action final'
  - content_idea: 'referência ao briefing (data/current-idea.json)'
  - format: 'carousel | reel | static | stories'
optional:
  - iteration: 'número da iteração (1, 2, 3) — default: 1'
  - previous_feedback: 'feedback da iteração anterior se houver'
```

## Execution Steps

### Step 1 — Load Context
```
1. Ler data/brandbook-carbon-films.yaml → carregar: cores, tipografia, voz, posicionamento
2. Ler data/content-pillars-framework.yaml → pilares editoriais ativos
3. Ler data/instagram-benchmarks.yaml → benchmarks de referência para o nicho
4. Ler data/current-idea.json → intenção original do conteúdo
```

### Step 2 — Evaluate IMPACTO (peso 30%)
```
Perguntas de avaliação:
- O hook tem um número, dado ou afirmação surpreendente?
- Nos primeiros 3 segundos, alguém no feed pararia para ler?
- O hook é específico para o nicho de videomaking/marketing ou genérico?
- Existe tensão ou curiosidade gerada logo de início?
- É diferente de 80%+ do conteúdo similar no feed?

Score 5: Hook excepcional — qualquer pessoa pararia o scroll
Score 4: Hook forte — maioria pararia
Score 3: Hook ok — parte do público pararia
Score 2: Hook fraco — só quem já conhece a marca pararia
Score 1: Hook genérico — seria ignorado
```

### Step 3 — Evaluate MARCA (peso 25%)
```
Comparar cada elemento com o brandbook:
- Cor de fundo: corresponde ao brandbook? (#050505 ou variações aprovadas)
- Tipografia: Anton para headlines, Montserrat para corpo?
- Logo: posicionado corretamente? Tamanho adequado?
- Voz da copy: direta, premium, sem jargão excessivo?
- Handle @carbonfilms.sc presente?
- Sem elementos visuais que "poluam" o estilo clean da marca?

Score 5: Perfeito — cada detalhe conforme brandbook
Score 4: Quase perfeito — 1 detalhe menor fora
Score 3: Aceitável — 2-3 detalhes fora mas não comprometem identidade
Score 2: Comprometido — elementos importantes fora do brandbook
Score 1: Fora do brand — parece de outra empresa
```

### Step 4 — Evaluate COPY (peso 20%)
```
Análise da progressão narrativa:
- Hook → Corpo → CTA tem progressão lógica?
- O corpo entrega o que o hook prometeu?
- Cada slide/parágrafo adiciona valor (não repete o anterior)?
- O CTA é específico e acionável (não apenas "siga nosso perfil")?
- Há erros gramaticais ou de concordância?
- A legenda tem profundidade suficiente (mín. 150 caracteres)?

Score 5: Copy irresistível — cada frase tem propósito
Score 4: Copy forte com 1-2 pontos que podem melhorar
Score 3: Copy ok — funciona mas não excita
Score 2: Copy fraca — falta progressão ou CTA
Score 1: Copy problemática — erros, repetição ou vazia
```

### Step 5 — Evaluate VISUAL (peso 15%)
```
Análise do arquivo de produção:
- Dimensões corretas para o formato?
- Texto dentro das safe zones (80px das bordas)?
- Contraste adequado (texto legível sobre o fundo)?
- Imagens sem distorção ou pixelação?
- Hierarquia visual clara (o que ver primeiro, segundo, terceiro)?
- Qualidade geral compatível com agência premium?

Score 5: Design premium e diferenciado
Score 4: Design profissional com mínimos ajustes possíveis
Score 3: Design adequado — funciona mas é comum
Score 2: Design com problemas visíveis que comprometem a percepção
Score 1: Design amador ou com erros técnicos
```

### Step 6 — Evaluate ESTRATÉGIA (peso 10%)
```
Contexto estratégico:
- Este conteúdo está alinhado com o pilar editorial ativo?
- O tema é relevante para o momento atual (não atrasado)?
- Serve ao objetivo de negócio (awareness/trust/conversion)?
- Está no formato certo para o objetivo?
- O horário sugerido é otimizado para máximo alcance?

Score 5: Conteúdo certo, formato certo, hora certa, objetivo certo
Score 4: Alinhado com pequeno desvio estratégico
Score 3: Relevante mas timing ou formato poderia ser melhor
Score 2: Desalinhado com objetivos ou pilar atual
Score 1: Completamente fora da estratégia
```

### Step 7 — Calculate Weighted Score
```
score_ponderado = (
  impacto * 0.30 +
  marca * 0.25 +
  copy * 0.20 +
  visual * 0.15 +
  estrategia * 0.10
)

threshold_aprovacao = 3.5
threshold_aprovacao_automatica = 4.5
```

### Step 8 — Generate Verdict
```
if score_ponderado >= 4.5:
  veredicto = APPROVED (automático, sem comentários de melhoria)
elif score_ponderado >= 3.5:
  veredicto = APPROVED (com 1 sugestão para próximo)
else:
  veredicto = REJECTED

if veredicto == REJECTED:
  - Listar problemas por prioridade (CRÍTICO > IMPORTANTE > OPCIONAL)
  - Para cada problema: problema específico + solução específica
  - Identificar qual agente deve receber o feedback
  - Verificar se iteration >= 3 → escalar para humano
```

## Output

```yaml
verdict: 'APPROVED | REJECTED'
score_ponderado: float  # ex: 4.2
scores:
  impacto: integer  # 1-5
  marca: integer
  copy: integer
  visual: integer
  estrategia: integer
approval_details:
  authorized_time: string  # se APPROVED
  strong_point: string
  improvement_suggestion: string  # opcional
rejection_details:
  problems: []  # lista ordenada por prioridade
  return_to_agent: string  # qual agente corrige
  instruction: string  # instrução específica
iteration: integer
escalate_to_human: boolean  # true se iteration >= 3
```

## Post-Task Actions

### Se APPROVED:
- Salvar registro em `data/quality-approvals.json`
- Autorizar passagem para stage: post
- Log: `[QUALITY] APPROVED — score: X.X — topic: [topic]`

### Se REJECTED:
- Salvar registro em `data/quality-rejections.json`
- Incrementar `iteration`
- Retornar para o agente indicado com instrução específica
- Se iteration >= 3: escalar para humano com relatório completo
- Log: `[QUALITY] REJECTED — score: X.X — reason: [main_issue]`

## Failure Modes

| Situação | Ação |
|----------|------|
| Pacote incompleto (sem visual) | Bloquear — não avaliar sem arquivo final |
| Brandbook não encontrado | Usar critérios gerais mas alertar sobre ausência |
| Score exatamente 3.5 | Arredondar para APPROVED mas indicar revisão no próximo |
| 3 rejeições atingidas | Escalar OBRIGATORIAMENTE para humano |
