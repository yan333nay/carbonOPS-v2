# Task: trend-analyst-scan-hot-news

**Agent:** Pulse (trend-analyst)
**Command:** `*scan-hot-news`
**Trigger:** Chamada como PRIMEIRO passo do research stage no post-creation-workflow

---

## Purpose

Pesquisar notícias quentes e acontecimentos recentes nos nichos relevantes para a Carbon Films. O objetivo é encontrar ganchos de atualidade — assuntos que estão sendo discutidos AGORA — para injetar nas postagens e dar um ângulo inovador e relevante ao conteúdo.

**Princípio do Gary Vee:** "Day Trading Attention — onde a atenção está barata hoje?"
**Princípio do Neil Patel:** "Search Everywhere Optimization — o que as pessoas estão buscando agora?"
**Princípio do Paulo Cuenca:** "Hot Topics têm janela de 24-48h — velocidade é vantagem competitiva."

## Inputs

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `brand_niches` | Sim | Nichos da marca (de brandbook-carbon-films.yaml) |
| `time_window` | Não | Janela de busca — padrão: `48h` |
| `search_depth` | Não | `quick` (3 buscas) ou `deep` (8 buscas) — padrão: `quick` |

## Nichos para pesquisar (Carbon Films)

```
Principal:    marketing digital, marketing visual, tráfego pago
Audiovisual:  produção de vídeo, drone footage, cinematografia comercial
Regional:     SC / Santa Catarina, mercado catarinense
Tendências:   IA no marketing, algoritmos Instagram 2026, Meta Ads
Negócios:     PME, empreendedorismo SC, branding para pequenas empresas
```

## Search Queries — executar em sequência

### Queries obrigatórias (executar sempre)

```
1. "marketing digital Brasil [mês/ano atual]"
   → Captura tendências gerais do mercado nacional

2. "Instagram algoritmo novidade 2026"
   → Mudanças de plataforma que afetam estratégia de conteúdo

3. "tráfego pago tendências [mês/ano atual]"
   → O que está mudando em Meta Ads, Google Ads

4. "produção de vídeo marketing tendências"
   → Novidades em audiovisual aplicado ao marketing
```

### Queries de nicho (executar se search_depth = deep)

```
5. "agência marketing Santa Catarina novidades"
   → Mercado local — oportunidade de posicionamento regional

6. "IA inteligência artificial marketing conteúdo 2026"
   → IA é hot topic constante no nicho — sempre relevante

7. "Instagram Reels TikTok tendência conteúdo [mês atual]"
   → Formatos e tipos de conteúdo em alta agora

8. "empreendedorismo PME SC marketing resultados"
   → Público-alvo da Carbon — o que está na cabeça deles
```

## Execução com WebSearch

Para cada query, o agente deve:

```
1. Executar busca via WebSearch
2. Filtrar resultados dos últimos 7 dias (priorizar) e 30 dias
3. Extrair:
   - Título e resumo do artigo/post
   - Data de publicação
   - Fonte (credibilidade 1-5)
   - Ângulo de conteúdo possível para Carbon Films
4. Classificar por urgência (hot/warm/evergreen)
```

## Classificação de Resultados

```
🔥 HOT (use em 24h):
   - Notícia breaking nas últimas 48h
   - Atualização de algoritmo ou política de plataforma
   - Trend viral começando agora

🌡️ WARM (use esta semana):
   - Debate ativo no nicho (3-7 dias)
   - Pesquisa ou estudo publicado recentemente
   - Case de sucesso ou fracasso notório

🌿 EVERGREEN (use quando quiser):
   - Assunto recorrente com nova perspectiva
   - Dado de mercado sempre relevante
   - Tema educacional sem urgência
```

## Filtros de Relevância para Carbon Films

Antes de incluir uma notícia no output, validar:

- [ ] Tem relação direta com marketing, produção de vídeo, branding ou tráfego pago?
- [ ] É relevante para o público da Carbon (empresas que querem crescer visualmente)?
- [ ] Pode ser transformada em conteúdo que gera valor (dica, opinião, dado)?
- [ ] É ângulo que a Carbon pode tratar com autoridade?

**Descartar se:**
- Notícia política sem relação com negócios
- Escândalo pessoal sem relevância para o nicho
- Conteúdo apenas de entretenimento sem aplicação profissional

## Output

```yaml
hot_news_report:
  generated_at: 'YYYY-MM-DDTHH:MM:SS'
  time_window: '48h'
  queries_executed: [array]

  hot_topics:
    - id: 'news-001'
      classification: 'HOT'        # HOT | WARM | EVERGREEN
      urgency_deadline: '24h'      # para HOT: quando a janela fecha
      headline: 'Título da notícia/tendência'
      source: 'nome da fonte'
      source_url: 'URL'
      source_credibility: 4        # 1-5
      published_date: 'YYYY-MM-DD'
      summary: 'Resumo de 2-3 linhas'
      carbon_angle: 'Como a Carbon Films pode usar isso em conteúdo'
      suggested_format: 'feed|carousel|reels|stories'
      suggested_hook: 'Proposta de hook baseado na notícia'
      content_pillar: 'educativo|portfolio|institucional|promocional'

    - id: 'news-002'
      # ...

  synthesis:
    top_opportunity: 'O tema mais urgente e com maior potencial'
    weekly_themes: ['tema 1', 'tema 2', 'tema 3']
    neil_patel_keywords: ['keyword 1', 'keyword 2']  # para SEO na legenda
```

## Integração no Workflow

Este output alimenta diretamente o `scan-trends` e o `suggest-content-from-trends`:

```
scan-hot-news (WebSearch)
    ↓
hot_news_report
    ↓ injetado como contexto adicional em:
scan-trends → enriquece com ângulo de atualidade
suggest-content-from-trends → prioriza sugestões com hot topics
    ↓
content_brief com campo novo: hot_news_angle (se aplicável)
```

## Exemplo de Output Esperado

```yaml
hot_topics:
  - id: news-001
    classification: HOT
    urgency_deadline: '24h'
    headline: 'Meta anuncia mudança no algoritmo de Reels — prioriza vídeos com som original'
    source: 'Marketing Land'
    source_credibility: 5
    published_date: '2026-03-27'
    summary: 'Meta atualizou o algoritmo do Instagram Reels dando boost extra para vídeos com áudio original gravado na hora, não trending sounds. Mudança já ativa.'
    carbon_angle: 'Carbon pode postar imediatamente sobre a mudança — posicionamento de autoridade sobre o tema + dica prática para clientes'
    suggested_format: 'reels'
    suggested_hook: 'O Instagram mudou TUDO sobre Reels ontem. Se você não viu, vai continuar perdendo alcance.'
    content_pillar: 'educativo'
```
