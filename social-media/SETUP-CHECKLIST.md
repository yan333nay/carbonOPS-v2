# Setup Checklist — Ultra Master Squad

Tudo que precisa ser configurado para o `post-creation-workflow` funcionar do início ao fim.
Siga a ordem — cada bloco depende do anterior.

---

## BLOCO 1 — Brandbook (fazer primeiro)

O brandbook é o contexto fixo de todos os agentes. Sem ele, nenhuma decisão de design, copy ou estratégia está alinhada com a marca.

**Arquivo:** `data/brandbook-context.yaml` (template pronto)

```
[ ] Duplicar como data/brandbook-{seu-cliente}.yaml
[ ] Preencher Seção 01 — Identidade
    - brand_name, tagline, mission, vision, values
    - target_audience (age_range, pain_points, desires)
    - unique_value_proposition, brand_positioning

[ ] Preencher Seção 02 — Visual
    - Cor primária, secundária, terciária (hex + rgb + nome)
    - Cores neutras e cores proibidas
    - Fontes: primary_font e secondary_font (nome exato no Canva)
    - Logo: links Canva para cada versão (primary, white, black, icon)

[ ] Preencher Seção 03 — Tom de Voz
    - personality_traits (3 traços)
    - formality_level (informal/semi-formal/formal)
    - vocabulary: preferred_words e forbidden_words
    - Exemplos aprovados e rejeitados de copy

[ ] Preencher Seção 04 — Guia de Posts
    - Grid por formato: onde fica foto, texto, logo em cada layout
    - Referências de exemplos aprovados (links Canva ou descrição)

[ ] Preencher Seção 05 — Fotografia
    - Mood visual, temperatura de cor, ângulos preferidos
    - Filtros aprovados (nome + configurações)
    - Filtros proibidos

[ ] Preencher Seção 06 — Métricas
    - KPIs com targets (saves, shares, engagement_rate, reach, followers)
    - Metas semanais de posts
    - Baselines de performance atuais

[ ] Mudar status: template → active
[ ] Teste: perguntar para um agente "quais são as cores da marca?" — deve responder corretamente
```

**Tempo estimado:** 1-2h para preencher com atenção

---

## BLOCO 2 — Canva API

Para o agente Pixel gerar as artes automaticamente.

```
[ ] Criar conta no Canva (se não tiver)
[ ] Acessar Canva for Developers: developers.canva.com
[ ] Criar um App no portal de developers
    - Name: "AIOX Social Squad"
    - Scopes necessários:
      - design:read
      - design:write
      - asset:read
      - asset:write

[ ] Copiar credenciais:
    - CANVA_CLIENT_ID=xxxxxxxx
    - CANVA_CLIENT_SECRET=xxxxxxxx

[ ] Criar 1 template por /comando no Canva (9 templates total)
    Prioridade para começar:
    1. /edicao-basica — mais simples, apenas branding
    2. /feed-impactante — mais usado
    3. /stories-simples — segundo mais usado
    (resto pode adicionar depois)

    Para cada template:
    - Criar nas dimensões corretas (ver data/technical-specs.yaml)
    - Aplicar brandbook: fontes, cores, posição do logo
    - Nomear: "aiox-{command-name}-template"
    - Copiar o Template ID (na URL do Canva ao editar)

[ ] Preencher template_ref em data/commands-library.yaml com os IDs reais
    Exemplo:
      feed-impactante:
        canva_template: 'DAxxxxxxxxxxxxxx'  # ID real aqui

[ ] Configurar credenciais no projeto:
    - Adicionar CANVA_CLIENT_ID e CANVA_CLIENT_SECRET ao .env
    - Verificar que .env está no .gitignore

[ ] Testar autenticação OAuth2 com o Canva API
[ ] Testar: criar um design simples via API e exportar
```

**Referência:** [Canva Connect API Docs](https://www.canva.com/developers/docs/connect-api/)

---

## BLOCO 3 — Instagram API (Meta Graph API)

Para o agendamento automático publicar diretamente no Instagram.

```
[ ] Conta Instagram deve ser do tipo Business ou Creator
    (conta pessoal não tem acesso à API de publicação)

[ ] Criar App no Meta for Developers: developers.facebook.com
    - Tipo: Business
    - Nome: "AIOX Social Publisher"
    - Produto: Instagram Graph API

[ ] Permissions necessárias:
    - instagram_basic
    - instagram_content_publish
    - pages_read_engagement
    - pages_show_list (para vincular com a Page do Facebook)

[ ] Gerar tokens:
    - META_ACCESS_TOKEN (long-lived token — 60 dias, mas renovável)
    - INSTAGRAM_BUSINESS_ACCOUNT_ID (ID da conta IG Business)
    - Anotar FACEBOOK_PAGE_ID vinculada à conta IG

[ ] Adicionar ao .env:
    META_ACCESS_TOKEN=xxxxxxxx
    INSTAGRAM_BUSINESS_ACCOUNT_ID=xxxxxxxx

[ ] Testar: publicar um post de teste via API (foto + legenda)
    Endpoint: POST /v19.0/{ig-user-id}/media
    Depois:   POST /v19.0/{ig-user-id}/media_publish

[ ] Testar: agendar um post para o futuro
```

**Observação:** A Meta exige que a imagem esteja em uma URL pública (não local).
Precisamos de um passo para hospedar a imagem exportada do Canva antes de enviar para a API.

```
[ ] Definir onde hospedar imagens temporariamente:
    Opção A: Cloudinary (free tier, CDN rápido) ← recomendo
    Opção B: Supabase Storage (já integrado ao AIOX)
    Opção C: S3 ou similar
```

---

## BLOCO 4 — Executor do Workflow

O workflow precisa de algo que orquestre a execução das etapas em sequência. Opções:

### Opção A: n8n (recomendado — já mencionado no projeto)
```
[ ] n8n rodando (local ou cloud)
[ ] Criar workflow n8n que chama cada etapa do post-creation-workflow.yaml
[ ] Nós necessários:
    - HTTP Request (para Canva API e Instagram API)
    - Code (para lógica de roteamento de agentes)
    - Wait (para checkpoint de aprovação humana)
    - Set / Merge (para passar dados entre etapas)
```

### Opção B: Script Node.js direto
```
[ ] Criar scripts/run-post-workflow.js
[ ] Inputs via CLI: foto + topic_hint opcional
[ ] Executa cada stage em sequência
[ ] Exibe preview para aprovação no terminal
[ ] Posta/agenda após confirmação
```

### Qual escolher?
- **n8n** → se já está rodando e você quer UI de monitoramento
- **Node.js** → mais simples, CLI first (alinhado com a Constitution do AIOX)

---

## BLOCO 5 — Dados de Nicho e Concorrentes

Para o `scan-trends` do Pulse funcionar bem.

```
[ ] Preencher no brandbook:
    - brand.niches: lista de nichos da marca (ex: [marketing, agencia, branding])
    - brand.competitors: lista de contas concorrentes para monitorar

[ ] Opcional: criar data/competitor-list.yaml com:
    - handle: @concorrente
    - platform: instagram
    - monitor_for: [formato, copy, frequencia]
```

---

## BLOCO 6 — Histórico de Performance (para Neil)

O Neil Patel mindclone precisa de baseline para calcular scores realistas.

```
[ ] Exportar métricas dos últimos 20-30 posts do Instagram
    (via Instagram Insights ou ferramenta como Metricool, Later, etc.)

[ ] Preencher no brandbook Seção 06:
    - engagement_rate_baseline (média atual)
    - average_reach_baseline (alcance médio por post)
    - saves_baseline (taxa de saves média)

[ ] Opcional mas valioso: criar data/top-posts-library.yaml
    - 10-20 posts que mais performaram com link + métricas
    - Neil usa para calibrar o que funciona especificamente para a audiência
```

---

## ORDEM SUGERIDA DE EXECUÇÃO

```
Semana 1 — Fundação
  [x] Bloco 1 — Brandbook preenchido
  [x] Bloco 2 — Canva API + 3 templates iniciais (/edicao-basica, /feed-impactante, /stories-simples)
  [x] Bloco 6 — Baselines de performance preenchidos

Semana 2 — Integração
  [ ] Bloco 3 — Instagram API + hospedagem de imagem
  [ ] Bloco 4 — Executor (n8n ou Node.js)
  [ ] Testar workflow completo com 3 posts reais

Semana 3 — Refinamento
  [ ] Bloco 5 — Dados de nicho e concorrentes para scan-trends
  [ ] Templates restantes (6 comandos faltando)
  [ ] 10 posts de teste para calibrar Neil
  [ ] WhatsApp intake (futuro)
```

---

## RESUMO — O QUE PRECISAMOS DECIDIR JUNTOS

Estas são as decisões que precisam da sua input antes de configurar:

1. **Brandbook** — Você preenche os dados da marca (cores, fontes, tom). Eu estruturo.

2. **Executor do workflow** — n8n (que já está no projeto) ou script Node.js?

3. **Hospedagem de imagem** — Cloudinary, Supabase Storage ou outra?

4. **Começamos por qual /comando?** — Recomendo `/edicao-basica` como primeiro teste (mais simples).

5. **Conta Instagram** — É Business ou Creator? Já tem Page do Facebook vinculada?
