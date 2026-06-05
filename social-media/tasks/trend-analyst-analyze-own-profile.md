# Task: trend-analyst-analyze-own-profile

**Agent:** Pulse (trend-analyst)
**Command:** `*analyze-own-profile`
**Trigger:** Manual ou semanal (domingo junto com weekly report)

---

## Purpose

Analisar o perfil próprio da marca no Instagram para identificar padrões de performance, gaps de conteúdo e oportunidades. Alimenta Rafael Kiso (ajuste de funil) e Neil Patel (calibração de scores).

## Método de Execução

### Via Apify (automático — quando configurado)

```
Actor: apify/instagram-profile-scraper
Input:
  usernames: [carbonfilms.sc]
  resultsLimit: 30  # últimos 30 posts
  scrapeFollowers: false  # evita rate limit

Retorna:
  - bio, seguidores, seguindo, posts total
  - últimos 30 posts: imagem_url, legenda, likes, comments, timestamp
  - tipo de post: image, video, carousel
```

**Configuração:** ver SETUP-CHECKLIST.md → Bloco Apify

### Via Screenshot Manual (fallback)

Quando Apify não estiver configurado, humano envia screenshot do perfil e dos últimos posts. O agente extrai as informações manualmente.

## Análise Executada

### 1. Performance por Formato

```
Para cada post nas últimas 4 semanas:
  - Tipo: feed / carrossel / reel / story
  - Engagement: likes + comments
  - Estimativa de alcance (se disponível)
  - Hook/título do post

Saída: ranking de formatos por engajamento médio
```

### 2. Padrões de Copy

```
Analisa legendas dos 10 posts com maior engajamento:
  - Extensão (curta/média/longa)
  - Presença de dados/números
  - Tipo de CTA usado
  - Emojis presentes ou não
  - Hashtag count

Saída: padrão de copy que performa melhor
```

### 3. Gaps de Conteúdo

```
Compara posts publicados vs mix ideal do brandbook:
  Ideal:  40% portfolio | 30% educativo | 20% institucional | 10% promo
  Real:   X% portfolio  | X% educativo  | X% institucional  | X% promo

Saída: qual pilar está sub-representado
```

### 4. Frequência e Consistência

```
- Posts por semana (últimas 4 semanas)
- Dias e horários mais frequentes
- Gaps (semanas sem post)

Saída: padrão de consistência e recomendação
```

### 5. Visual Consistency Score

```
Verificar nos últimos 9 posts (visão de grid):
  - Paleta de cores consistente com brandbook
  - Tipografia reconhecível
  - Estilo fotográfico uniforme

Saída: score 1-5 + o que precisa corrigir
```

## Output

```yaml
profile_analysis:
  analyzed_at: 'YYYY-MM-DD'
  profile: '@carbonfilms.sc'
  period: 'últimas 4 semanas'

  stats:
    followers: integer
    following: integer
    total_posts: integer
    avg_posts_per_week: float

  performance_by_format:
    feed:
      count: integer
      avg_engagement: float
      best_post: string
    carousel:
      count: integer
      avg_engagement: float
      best_post: string
    reels:
      count: integer
      avg_engagement: float
      best_post: string

  top_performing_posts:
    - rank: 1
      type: feed|carousel|reels
      hook: string
      engagement: integer
      what_worked: string

  content_mix_actual:
    portfolio: float       # % real
    educativo: float
    institucional: float
    promocional: float

  content_mix_gap:
    under_represented: string   # pilar mais carente
    over_represented: string    # pilar em excesso

  copy_patterns:
    best_performing_style: string
    avg_caption_length: short|medium|long
    numbers_in_hook: boolean
    cta_type_that_works: string

  consistency_score: 1-5
  frequency_score: 1-5
  visual_score: 1-5

  recommendations:
    - priority: high
      action: string
      reason: string
    - priority: medium
      action: string
      reason: string

  neil_calibration:
    # Atualiza baselines no brandbook
    engagement_rate_baseline: float
    average_reach_baseline: float
    saves_baseline: float
```

## Integração com Outros Agentes

Após análise, o output é passado para:
- **Rafael Kiso** → ajusta distribuição de pilares na estratégia
- **Neil Patel** → recalibra scores de engajamento com dados reais
- **Nova (content-strategist)** → atualiza editorial calendar com gaps identificados
