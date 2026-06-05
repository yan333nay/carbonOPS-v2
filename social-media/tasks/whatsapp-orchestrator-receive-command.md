# Task: whatsapp-orchestrator-receive-command

**Agent:** Kai (whatsapp-orchestrator)
**Command:** `*receive-command`
**Trigger:** Incoming WhatsApp webhook — photo + text message

---

## Purpose

Process an incoming WhatsApp message containing a photo and optional /command. Identify the execution mode, validate inputs, and route to the correct pipeline.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `photo` | Yes | Image file from WhatsApp (JPG/PNG/HEIC) |
| `message_text` | No | Text of the message (may or may not contain /command) |
| `sender_id` | Yes | WhatsApp sender identifier |
| `client_id` | Yes | Client context for multi-client scenarios |
| `timestamp` | Yes | Message timestamp |

## Execution Modes

### Modo Rápido (if /command detected in message_text)

```
1. Identify /command from message_text
2. Validate command exists in data/commands-library.yaml
3. Load command specs (pipeline_order, template, visual_style, copy_tone)
4. Load brandbook context (data/brandbook-{client}.yaml)
5. Execute *execute-pipeline with command + photo
```

### Modo Consultivo (if NO /command detected)

```
1. Analyze photo content (subject, mood, quality)
2. Generate 2-3 contextual questions:
   - "Qual o objetivo desse post? (resultado, bastidor, autoridade, tendência)"
   - "Para qual rede? (Instagram, TikTok, ambas)"
   - [optional 3rd based on photo content]
3. Send questions to WhatsApp
4. Wait for response
5. Route to *execute-pipeline with inferred command based on answers
```

## Command Detection Rules

```
/feed-impactante → exact match or "feed impactante"
/stories-simples → exact match or "stories simples" or "stories"
/carrossel-edu   → exact match or "carrossel" or "carousel"
/reels-trend     → exact match or "reel" or "reels trend"
/resultado-cliente → exact match or "resultado" or "cliente"
/bastidores      → exact match or "bastidor" or "bts"
/tiktok-viral    → exact match or "tiktok" or "viral"
/autoridade      → exact match or "autoridade" or "opiniao"
/edicao-basica   → exact match or "edicao" or "edita"
```

## Validation

Before routing to pipeline, validate:
- [ ] Photo is valid image format (JPG, PNG, HEIC, WEBP)
- [ ] Photo minimum resolution: 500px on shortest side
- [ ] Command exists in commands library
- [ ] Client brandbook file exists and status is `active`

## Error Handling

| Error | Response |
|-------|----------|
| Invalid image format | "Foto não reconhecida. Envie em JPG, PNG ou HEIC." |
| Image too small | "Foto muito pequena. Mínimo 500px. Envie uma versão maior." |
| Unknown command | "Comando não reconhecido. Comandos disponíveis: [list]. Ou envie a foto sem comando para modo consultivo." |
| No brandbook | "Brandbook não configurado para este cliente. @devops configure data/brandbook-{client}.yaml" |

## Output

Routes to `*execute-pipeline` with:
```yaml
command: /command-name
photo: [file or URL]
client_id: string
brandbook_path: data/brandbook-{client}.yaml
pipeline_config: [from commands-library.yaml]
mode: rapido | consultivo
```

## Performance Target

- Command identification: < 2 seconds
- Route to pipeline: < 5 seconds total intake processing
