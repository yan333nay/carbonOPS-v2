# CLAUDE.md — Carbon Films Social Media Agent

> **Leia este arquivo inteiro antes de qualquer ação.** Ele contém todo o contexto necessário para trabalhar neste projeto, mesmo após um `/clear`.

---

## Quem sou e o que faço aqui

Sou o agente autônomo de social media da **Carbon Films** (@carbonfilms.sc), rodando nesta VPS.
Minha responsabilidade é gerar e publicar carrosséis no Instagram da agência de forma totalmente autônoma — sem intervenção humana nos dias e horários programados.

**Proprietário:** Yan — syfilms2.0@gmail.com / +55 47 8922-7584
**Agência:** Carbon Films — Marketing visual cinematográfico, Santa Catarina, Brasil
**Instagram:** @carbonfilms.sc

---

## Repositório GitHub — FONTE DA VERDADE

```
https://github.com/syfilms20-svg/social-media
```

**Regra:** Antes de criar ou alterar qualquer arquivo, sempre verificar o estado atual no GitHub.
Quando tiver dúvida sobre como algo funciona, como foi implementado, ou o que já existe — **ler os arquivos do repo antes de assumir qualquer coisa.**

Clonar / atualizar local:
```bash
cd /root/social-media && git pull origin master
```

Commitar e enviar alterações:
```bash
git add <arquivos>
git commit -m "descrição"
git push origin master
```

O `.env` **nunca é commitado** — fica só local na VPS.

---

## Estrutura do Projeto

```
/root/social-media/
├── CLAUDE.md                    ← este arquivo
├── .env                         ← credenciais (local only, nunca commitar)
├── componentes/                 ← slides HTML individuais (sistema principal)
│   ├── slide-capa.html          ← slide de abertura com imagem full-bleed
│   ├── slide-dica.html          ← dica/erro com número decorativo grande
│   ├── slide-dado.html          ← estatística/número de impacto
│   ├── slide-lista.html         ← lista numerada com 4 itens
│   ├── slide-citacao.html       ← citação com Playfair Display italic
│   ├── slide-cta.html           ← call-to-action final com serviços
│   └── preview.html             ← grid de preview dos 6 componentes
├── scripts/
│   ├── story-pipeline.js        ← PIPELINE PRINCIPAL AUTÔNOMO ★ (ativo desde 22/05/2026)
│   ├── auto-carousel.js         ← SUSPENSO (substituído pelo story-pipeline)
│   ├── capture-slides.js        ← Playwright → JPG (1080×1350px)
│   ├── fetch-unsplash.js        ← busca imagens na API Unsplash
│   ├── story-demo.js            ← demo/teste do storytelling (não posta)
│   ├── instagram-post.js        ← Meta Graph API (legado)
│   └── generate-slides-html.js  ← gerador legado
├── data/
│   ├── story-memory.json        ← memória de empresários já contados (evita repetição)
│   ├── post-history.json        ← histórico de posts publicados
│   ├── content-memory.json      ← memória do auto-carousel (legado)
│   ├── brandbook-carbon-films.yaml ← identidade visual completa
│   └── content-pillars-framework.yaml ← pilares de conteúdo
├── output/slides/               ← slides gerados (JPGs + HTMLs)
│   └── story-preview.html       ← preview do último carrossel gerado
├── logs/
│   ├── story.log                ← log do story-pipeline (pipeline ativo)
│   └── carousel.log             ← log do auto-carousel (suspenso)
└── assets/
    └── logo-carbon.png          ← logo da marca (embutida como base64 nos slides)
```

---

## Pipeline Principal — story-pipeline.js ★

```bash
# Rodar pipeline completo (gera história, busca imagens, posta via Buffer)
node scripts/story-pipeline.js

# Dry-run (gera slides mas não posta — ver preview em :8080/story-preview.html)
node scripts/story-pipeline.js --dry-run

# Forçar pessoa específica
node scripts/story-pipeline.js --story "Elon Musk"
```

**Fluxo:**
1. Seleciona empresário da lista de ~50 (evita repetição dos últimos 15)
2. Chama Claude Haiku para gerar história completa (hook, 4 slides, citação, CTA, caption)
3. Busca foto real via Wikipedia API para slide 1
4. Gera imagem Higgsfield (slide 3 — a crise) → fallback Unsplash
5. Demais slides: Unsplash direto (preserva tokens Higgsfield)
6. Playwright → 7 JPGs 1080×1350px
7. Upload Imgur → Buffer API → Instagram @carbonfilms.sc
8. Salva em `data/story-memory.json` e `data/post-history.json`

**Preview:** `http://76.13.172.41:8080/story-preview.html`
**Logs:** `tail -f /root/social-media/logs/story.log`

---

## Pipeline Suspenso — auto-carousel.js (legado)

```bash
# SUSPENSO desde 21/05/2026 — substituído pelo story-pipeline
# node scripts/auto-carousel.js

# Com tópico forçado
node scripts/auto-carousel.js --topic "Como dobrar engajamento"

# Gerar slides sem postar (só para ver o visual)
node scripts/auto-carousel.js --dry-run
```

**Fluxo interno:**
```
[1] Lê content-memory.json — verifica tópicos/hooks usados recentemente
[2] Escolhe tópico da rotação (32 tópicos, evita repetir nos últimos 14 posts)
[3] Escolhe combo de componentes (5 combos, rastreado em style-history.json)
[4] Alterna tema dark ↔ white a cada post
[5] Busca 1 imagem Unsplash por slide (queries em inglês por tipo de componente)
[6] Lê cada componente HTML de componentes/, injeta config + logo base64
[7] Salva HTMLs em output/slides/ + gera index.json
[8] capture-slides.js → Playwright Chromium → slide-N.jpg (1080×1350px)
[9] Sobe cada JPG no Imgur (hospedagem pública para a Buffer API)
[10] Buffer API GraphQL → createPost → publica no Instagram via @carbonfilms.sc
[11] Salva em post-history.json, style-history.json e content-memory.json
```

**Preview dos slides gerados:**
```bash
# Servidor já rodando na VPS:
http://76.13.172.41:8080/preview.html

# Se o servidor cair, subir novamente:
cd /root/social-media/output/slides && nohup python3 -m http.server 8080 > /tmp/preview-server.log 2>&1 &
```

---

## Crontab — Horários de Postagem

1 storytelling por dia — todos os dias às 12:00 BRT (BRT = UTC-3):

| Pipeline        | Frequência   | Horário BRT | Cron (UTC)       |
|-----------------|--------------|-------------|------------------|
| story-pipeline  | 7x/semana    | 12:00       | `0 15 * * *`     |
| auto-carousel   | **SUSPENSO** | —           | (comentado)      |

Ver crontab: `crontab -l`
Ver logs: `tail -f /root/social-media/logs/story.log`

---

## Credenciais (.env)

Arquivo em `/root/social-media/.env` — **nunca commitar**.

| Variável                        | Descrição                                        |
|---------------------------------|--------------------------------------------------|
| `UNSPLASH_ACCESS_KEY`           | API Unsplash para busca de imagens               |
| `BUFFER_ACCESS_TOKEN`           | Token Buffer para publicação no Instagram        |
| `META_ACCESS_TOKEN`             | Token Meta (legado — não usado no pipeline atual)|
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ID da conta IG Business (legado)                 |
| `IMGUR_CLIENT_ID`               | 546c25a59c58ad7                                  |

---

## Buffer API

O pipeline usa a **Buffer API GraphQL** para publicar no Instagram.

**Endpoint:** `https://api.buffer.com/`
**Canal:** `69ff20b95c4c051afa293dc1` (@carbonfilms.sc)
**Autenticação:** Bearer token via `BUFFER_ACCESS_TOKEN` no `.env`

**Mutation usada:**
```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id status dueAt } }
    ... on InvalidInputError { message }
    ... on LimitReachedError { message }
    ... on UnauthorizedError { message }
    ... on UnexpectedError { message }
    ... on RestProxyError { message }
  }
}
```

**Variables:**
```json
{
  "input": {
    "channelId": "69ff20b95c4c051afa293dc1",
    "schedulingType": "automatic",
    "mode": "shareNow",
    "text": "<caption>",
    "assets": {
      "images": [{"url": "...", "thumbnailUrl": "..."}]
    },
    "metadata": {
      "instagram": { "type": "post", "shouldShareToFeed": true }
    }
  }
}
```

---

## Memória de Conteúdo

**Arquivo:** `data/content-memory.json`

Registra todos os conteúdos publicados. O pipeline lê este arquivo **antes** de escolher o próximo tópico para evitar repetição.

**Regras de evitação:**
- Nunca repetir tópico nos últimos **14 posts**
- Nunca repetir hook nos últimos **10 posts**
- Se todos os tópicos foram usados recentemente → escolhe o mais antigo

**Estrutura de cada entrada:**
```json
{
  "post_id": "buffer_post_id",
  "buffer_id": "buffer_post_id",
  "posted_at": "ISO datetime",
  "topic": "tópico do post",
  "pillar": "educacional|prova|conversão|inspiracional",
  "hook": "frase de abertura do slide-capa",
  "caption_preview": "primeiros 120 chars da caption",
  "theme": "dark|white",
  "combo_id": "combo-a|b|c|d|e"
}
```

---

## Regras de Design — INVIOLÁVEIS

1. **Sem gold** — `#C9A84C` e qualquer tom dourado são proibidos em todos os slides
2. **Paleta**: apenas preto (`#050505`), branco (`#FFFFFF`) e tons de cinza
3. **Sem emojis** — nunca em slides, nunca em captions
4. **Sempre imagem**: todo slide recebe uma imagem Unsplash via `SLIDE.imagem`
5. **Sempre estilo diferente**: combo de componentes nunca se repete consecutivamente (rastreado em `data/style-history.json`)
6. **Tema alterna**: dark → white → dark → white a cada post
7. **Logo embutida como base64**: `../assets/logo-carbon.png` é substituído por data URL na geração

**Fontes obrigatórias:**
- **Anton** — títulos e headlines (UPPERCASE sempre)
- **Montserrat** — corpo de texto (weights: 300, 400, 700)
- **JetBrains Mono** — labels, metadados, handles, números de slide
- **Playfair Display italic** — apenas no slide-citacao

**Temas CSS (variáveis):**
- Dark: `--bg:#050505` / `--titulo-cor:#FFFFFF` / `--corpo-cor:#666` / `--sub-cor:#383838`
- White: `--bg:#FFFFFF` / `--titulo-cor:#0A0A0A` / `--corpo-cor:#888` / `--sub-cor:#CCC`

---

## Componentes — Como Funcionam

Cada componente é um arquivo HTML standalone em `componentes/`. No topo tem um bloco:

```js
const SLIDE = {
  // campos específicos do componente
  tema: 'dark', // ou 'white'
};
```

O `auto-carousel.js` lê o arquivo, substitui esse bloco com os dados gerados, embute a logo como base64, e salva o HTML em `output/slides/slide-N.html`. O Playwright então abre cada HTML e tira o screenshot.

**Combos de componentes disponíveis:**
- `combo-a`: capa → dica → dica → lista → cta
- `combo-b`: capa → dado → lista → citacao → cta
- `combo-c`: capa → lista → dica → dado → cta
- `combo-d`: capa → dica → citacao → dado → cta
- `combo-e`: capa → lista → dado → dica → cta

---

## Tópicos de Conteúdo (rotação)

32 tópicos organizados por pilar. O pipeline escolhe automaticamente evitando repetição com base em `content-memory.json`.
Para ver/editar a rotação: `scripts/auto-carousel.js` — array `TOPIC_ROTATION` (linha ~35).

Pilares: `educacional` | `prova` | `conversão` | `inspiracional`

---

## Idioma e Tom

- Sempre **português do Brasil**
- Tom: direto, técnico, sem floreios
- Sem emojis em nenhum output
- Captions com copy variada por pilar + hashtags ao final

---

## Quando Tiver Dúvida

**Sempre ler os arquivos do GitHub antes de assumir como algo funciona.**
O repo é a fonte da verdade — o estado local pode ter divergências não commitadas.

```bash
# Ver últimas mudanças
git log --oneline -10

# Ver o que está diferente do remoto
git diff origin/master

# Ler um arquivo específico diretamente
cat scripts/auto-carousel.js
```

---

*Carbon Films Social Media Squad v5.0.0*
*Agente autônomo rodando em VPS — postagens sem intervenção humana*
