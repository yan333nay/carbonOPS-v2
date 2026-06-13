---
version: alpha
name: Carbon Films
description: Sistema visual cinematografico para a agencia de marketing visual Carbon Films. Monocromatico total — sem dourado. Preto profundo, branco puro, cinzas.
colors:
  background: "#050505"
  surface: "#111111"
  elevated: "#161616"
  glass: "#1A1A1A"
  border: "#1F1F1F"
  border-active: "#2A2A2A"
  dim: "#3A3A3A"
  on-surface-tertiary: "#6B6B6B"
  on-surface-secondary: "#A0A0A0"
  on-surface: "#FFFFFF"
  primary: "#FFFFFF"
  on-primary: "#050505"
typography:
  display:
    fontFamily: Anton
    fontSize: 112px
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 38px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0.04em
  headline-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.04em
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.7
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.7
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.35em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: 0.5em
  italic-lg:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.5
logo:
  symbol: escudo geometrico angular com corte de relampago diagonal e grafico de barras
  white: assets/logo-white.png
  black: assets/logo-black.png
  gray: assets/logo-gray.png
  white-on-black: assets/logo-white-on-black.png
  black-on-white: assets/logo-black-on-white.png
  sm: assets/logo-white-sm.png
  favicon: assets/favicon-64.png
  min-size: 32px
  aspect-ratio: "1:1"
rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
  xl: 0px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 24px
  section-x: 72px
  section-y: 120px
  container-max: 1280px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 11px 28px
  button-primary-hover:
    backgroundColor: transparent
    textColor: "{colors.primary}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 11px 28px
  button-ghost-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-mono:
    backgroundColor: transparent
    textColor: "{colors.on-surface-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 8px 0px
  button-mono-hover:
    textColor: "{colors.primary}"
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  card-glass:
    backgroundColor: rgba(26, 26, 26, 0.7)
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 4px 12px
  badge:
    backgroundColor: transparent
    textColor: "{colors.dim}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 2px 8px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 16px
  nav:
    backgroundColor: rgba(5, 5, 5, 0.97)
    textColor: "{colors.on-surface-secondary}"
    typography: "{typography.label-md}"
---

## Brand & Style

Carbon Films e uma agencia de marketing visual e producao audiovisual de Santa Catarina com atuacao nacional. A identidade visual destila a estetica cinematografica em seus elementos mais essenciais: preto profundo, branco absoluto e textura de granulacao analogica.

O sistema visual opera em **monocromatismo total**. Nao ha cor vibrante, saturacao excessiva ou dourado. A hierarquia e construida inteiramente por contraste tonal, peso tipografico e espacamento — como um filme em preto e branco onde a luz e a sombra fazem todo o trabalho narrativo.

A personalidade da marca e **sofisticada, tecnica e precisa**. O design deve remeter a precisao de equipamentos cinematograficos, a autoridade de uma producao premium e a austeridade de marcas de luxo europeu. Cada pixel tem proposito. Nada e decorativo sem funcao.

**Arquetipos de marca:** Criador (50%) + Governante (30%) + Sabio (20%).

## Colors

A paleta e construida sobre uma hierarquia de cinco camadas de preto — do mais absoluto ao mais luminoso — com branco puro como unico ponto de chegada de luz.

- **Background (#050505):** Carbon Black. O preto mais profundo, quase absoluto. Fundo do corpo da pagina — cria a sensacao de tela de cinema apagada.
- **Surface (#111111):** Primeira camada de elevacao. Cards, paineis e secoes alternadas vivem aqui.
- **Elevated (#161616):** Segunda camada. Elementos que precisam se destacar do surface — estados de hover em cards.
- **Glass (#1A1A1A):** Camada de overlay. Modais, drawers, elementos com backdrop blur.
- **Border (#1F1F1F) / Border Active (#2A2A2A):** Bordas sutis e bordas ativas. Separam planos sem adicionar ruido visual.
- **Dim (#3A3A3A):** Zona de elementos desabilitados, placeholders e ornamentos extremamente sutis.
- **On-Surface Secondary (#A0A0A0):** Texto secundario, subtitulos, labels. Contraste AA contra o background.
- **On-Surface / Primary (#FFFFFF):** Branco puro. Texto principal, titulos, botoes primarios, acao. Contraste AAA (19.8:1) contra o background.

Gradientes sao proibidos como elemento decorativo. A unica excecao e o gradiente linear na navegacao (de rgba(5,5,5,0.97) para transparente) — funcional, nao ornamental.

## Typography

A estrategia tipografica usa **quatro familias com papeis rigidamente definidos**. Mistura nao autorizada invalida a identidade.

- **Anton** e a voz de impacto maxima. Usada exclusivamente para display, hero e headlines gigantes. Sempre maiuscula, nunca com tracking positivo. Transmite monumentalidade cinematografica — como um titulo de abertura de filme.
- **Montserrat** e a voz funcional da marca. Usada para todo o corpo de texto, headings de secao e UI geral. Em peso 800 para titulos (autoritativo), em peso 300 para corpo (legivel e moderno).
- **JetBrains Mono** e a voz tecnica. Usada para labels, tags, itens de navegacao, botoes e codigos de referencia (CF_001). Sempre maiuscula com tracking alto — evoca precisao de equipamento e codigo de producao.
- **Playfair Display** e a voz elegante — usada apenas em italico para citacoes, taglines e contraponto decorativo com Anton. Nunca em regular, nunca em maiusculo.

Hierarquia de escala: display (112px) → headline-lg (38px) → headline-md (32px) → headline-sm (24px) → body-lg (18px) → body-md (16px) → label-md (10px) → label-sm (9px).

## Layout & Spacing

O layout segue um **Grid Fixo de 12 colunas** em desktop com max-width de 1280px, transitando para 6 colunas em tablet e coluna unica em mobile.

A escala de espacamento usa base de 4px (nao 8px) para permitir micro-ajustes precisos. Os valores chave sao: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120px.

O **espaco negativo e intencionalmente generoso**. Secoes tem padding vertical de 120px em desktop (80px tablet, 60px mobile). Esse espaco respiravel e parte da identidade — reforca o posicionamento premium e cinematografico.

Container: 1280px max-width, centralizado. Padding horizontal das secoes: 72px desktop, 48px tablet, 24px mobile. Gutter entre colunas: 24px.

## Elevation & Depth

Profundidade e construida por **camadas tonais**, nao por sombras. Nao ha box-shadow na identidade Carbon Films.

- **Nivel 0 (Background):** #050505 — o "void" cinematografico.
- **Nivel 1 (Surface):** #111111 — o plano principal de conteudo.
- **Nivel 2 (Elevated):** #161616 — estados de hover em cards, elementos destacados.
- **Nivel 3 (Glass):** rgba(26,26,26,0.7) com backdrop-filter blur(20px) — sobreposicoes, modais.
- **Nivel 4 (Navegacao):** rgba(5,5,5,0.97) com backdrop-filter blur(14px) — nav fixa.

Bordas fazem o trabalho de separacao: `1px solid #1F1F1F` em repouso, `1px solid #2A2A2A` em hover. A borda nunca e branca, exceto em estados de foco de acessibilidade (2px solid #FFFFFF, offset 2px).

**Film grain** (ruido fractal SVG em opacity 0.5, z-index 9000) e aplicado em todas as paginas como overlay fixo — e parte indissociavel da identidade, nao um efeito opcional.

## Shapes

A linguagem de formas e **absolutamente angular**. Zero border-radius em todos os elementos interativos: botoes, cards, inputs, tags, badges, modais.

Esta escolha nao e austericidade — e declaracao de identidade. Cantos retos evocam corte cinematografico, quadro de camera, precisao de equipamento. A unica excecao permitida sao elementos explicitamente circulares: o cursor customizado (dot 6px + ring 32px).

Linhas decorativas (1px, cor border-active) podem ser usadas como separadores horizontais ou como elemento antes de section labels. Nunca como ornamento sem funcao estrutural.

## Components

### Botoes

Tres variantes, todas com fonte JetBrains Mono uppercase e tracking 0.35em. O sistema de botoes opera em inversao: o que e solido vira transparente no hover, e vice-versa.

**Primary:** Branco solido (#FFFFFF bg, #050505 text). No hover: transparente bg, branco text, borda branca. O botao mais importante da tela — usar uma vez por contexto.

**Ghost:** Transparente bg, borda branca, branco text. No hover: branco bg, preto text. Variante secundaria — pode coexistir com primary.

**Mono:** Sem fundo, sem borda lateral. Apenas texto cinza com underline sutil (1px #2A2A2A). No hover: texto branco, underline branco. Para acoes terciarias, links e navegacao inline.

### Cards

**Standard:** Background surface (#111111), borda 1px border (#1F1F1F), padding 32px. No hover: borda sobe para border-active (#2A2A2A), background vai para elevated (#161616), translateY(-4px) com easing snap.

**Glass:** Background rgba(26,26,26,0.7), borda 1px rgba(255,255,255,0.06), backdrop-filter blur(20px), padding 32px. Para elementos sobre imagens ou backgrounds de video.

### Inputs

Fundo surface (#111111), borda border, sem radius. Placeholder em JetBrains Mono uppercase (#3A3A3A). No hover: borda sobe para border-active, fundo para elevated. No focus: borda branca (#FFFFFF) — maximo contraste, clareza absoluta de estado.

### Navegacao

Fixa no topo. Background linear-gradient de rgba(5,5,5,0.97) para transparente (70% → 100%) com backdrop-filter blur(14px). Borda inferior 1px rgba(255,255,255,0.04). Links em JetBrains Mono 0.62rem, tracking 0.35em, uppercase, cor on-surface-secondary. No hover/active: cor white + underline animado (width 0 → 100%, 250ms ease-snap).

### Section Label

Elemento de introducao de secao. JetBrains Mono 9px, tracking 0.5em, uppercase, cor on-surface-secondary. Prefixado por linha horizontal 24px x 1px (cor border-active). Usado antes do titulo de cada secao.

### Tags & Badges

**Tag:** Surface bg, border border, label-sm font, padding 4px 12px. Para categorias e servicos.

**Badge:** Sem fundo, borda border-active, label-sm font (dim color). Para codigos de referencia internos (CF_001, CF_047).

## Do's and Don'ts

- Usar branco (#FFFFFF) apenas como texto principal, accent e botao primario — nunca como background
- Manter monocromatismo absoluto — qualquer cor saturada (vermelho, azul, verde, laranja) e proibida
- Usar Anton sempre em maiusculo e nunca com tracking positivo
- Usar JetBrains Mono sempre em maiusculo com tracking minimo de 0.35em
- Usar Playfair Display apenas em italico — nunca em regular, nunca em maiusculo
- Manter zero border-radius em todos os elementos UI — nenhuma excecao alem do cursor circular
- Incluir film grain overlay em todas as paginas — e parte da identidade, nao opcional
- Aplicar foco visivel (outline: 2px solid #FFFFFF, offset: 2px) em todos os elementos interativos
- Nao usar box-shadow como elemento de elevacao — usar camadas tonais (surface → elevated → glass)
- Nao misturar pesos de Montserrat em um mesmo nivel hierarquico (escolha um peso por role)
- Nao usar mais de dois tamanhos tipograficos em um mesmo componente
- Nao usar o cursor padrao do sistema (body usa cursor: none — o cursor customizado e obrigatorio)
- Nao usar dourado, amarelo, cobre ou qualquer tom quente como accent
- Nao usar gradientes decorativos — apenas o gradiente funcional da navegacao e permitido
