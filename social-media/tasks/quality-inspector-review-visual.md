# quality-inspector-review-visual

## Task Identity

- **Agent:** quality-inspector (Vera)
- **Command:** `*review-visual`
- **Version:** 1.0.0
- **Category:** quality-control

## Purpose

Avaliação focada exclusivamente no visual: dimensões, brandbook, safe zones, qualidade técnica e impacto estético. Usada quando apenas o design precisa de revisão ou como diagnóstico isolado.

## Input

```yaml
required:
  - production_file: 'path para o arquivo de produção (imagem ou vídeo)'
  - format: 'carousel | reel | static | stories'
optional:
  - slide_count: integer  # para carrosséis
  - brandbook_ref: 'data/brandbook-carbon-films.yaml'  # default
```

## Technical Validation

### Dimensions Check
```yaml
expected_dimensions:
  carousel: '1080x1080px ou 1080x1350px (4:5)'
  reel: '1080x1920px (9:16)'
  static: '1080x1080px ou 1080x1350px'
  stories: '1080x1920px (9:16)'

safe_zone: '80px todos os lados'
max_file_size_jpg: '8MB por slide'
color_profile: 'sRGB'
```

### Brandbook Enforcement
```
Carbon Films Official Palette:
- Fundo: #050505 (dark) ou #FFFFFF (white)
- Surface: #111111
- Gold: #C9A84C (apenas como accent)
- Texto: #FFFFFF (dark mode) | #0A0A0A (white mode)
- Red accent: #FF0000 (último elemento do hook apenas)
- Gray: #888888 (corpo de texto)

Typography rules:
- Headlines: Anton (UPPERCASE SEMPRE)
- Corpo: Montserrat 400 ou 700
- Mono: JetBrains Mono (dados e métricas)
- PROIBIDO: qualquer outra fonte sem aprovação

Logo rules:
- Presente em TODOS os slides
- Posição: top-left em slides conteúdo, centralizado no CTA
- Handle @carbonfilms.sc: bottom de cada slide
- Tamanho: proporcional ao slide (não miniaturizado, não gigante)
```

### Visual Hierarchy Check
```
Verificar:
1. O que o olho vê primeiro? (deve ser o hook/headline)
2. O que vê segundo? (corpo ou imagem principal)
3. O que vê terceiro? (CTA ou logo)

Problemas comuns:
- Logo grande demais compete com headline
- Imagem de fundo muito saturada compromete leitura
- CTA perdido no meio dos elementos
- Texto branco sobre fundo claro (ilegível)
```

### Quality Indicators
```
Verificar cada elemento:
- [ ] Imagens sem pixelação (mín. 72dpi, preferencialmente 150dpi+)
- [ ] Textos dentro das safe zones (80px das bordas)
- [ ] Contraste texto/fundo: mínimo 4.5:1 (WCAG AA)
- [ ] Nenhum texto cortado nas bordas
- [ ] Sem lorem ipsum ou placeholders
- [ ] Consistência visual entre slides (carrossel)
- [ ] Animação suave se aplicável (vídeo)
- [ ] Sem watermarks indesejados
```

## Output

```yaml
visual_score: integer  # 1-5
technical_issues:
  - type: 'dimensions | safe_zone | resolution | file_size'
    description: string
    blocking: boolean  # se true, impede aprovação
brand_issues:
  - element: 'color | typography | logo | handle'
    expected: string
    found: string
    severity: 'critical | important | minor'
hierarchy_assessment: string  # descrição da hierarquia visual
verdict: 'APPROVED | NEEDS_REVISION | BLOCKED'  # BLOCKED = problema técnico impeditivo
notes: string
```
