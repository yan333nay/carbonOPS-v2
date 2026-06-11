"""
Social Worker
Responsável: Criação de conteúdo para redes sociais
"""
from core.claude_client import ask_json
from core.config import brain_context

SYSTEM = """
Você é o Social Agent da Carbon Films.
Sua função é criar conteúdo de alta qualidade para redes sociais,
especialmente voltado ao mercado imobiliário.
Siga sempre a estratégia de conteúdo e o tom de voz da empresa.
Seja criativo, direto e orientado a gerar engajamento.
"""

def execute(task: dict) -> str:
    brain = brain_context()

    prompt = f"""
## Contexto da empresa
{brain}

## Tarefa a executar
{task['task']}

## O que fazer
Crie o conteúdo solicitado. Retorne um JSON:
{{
  "summary": "o que foi criado",
  "posts": [
    {{
      "platform": "instagram | linkedin | whatsapp_status",
      "format": "reels | carrossel | post_simples | stories",
      "pillar": "portfolio | educacao | bts | prospeccao",
      "caption": "legenda completa com emojis e hashtags",
      "visual_direction": "descrição do visual/imagem ideal para esse post",
      "best_time": "melhor horário para postar (ex: 18h terça)"
    }}
  ],
  "next_action": "próximo passo"
}}
"""

    result = ask_json(SYSTEM, prompt)

    posts = result.get("posts", [])
    output = result.get("summary", "")
    if posts:
        output += f" | {len(posts)} post(s) criado(s)."
        for i, p in enumerate(posts, 1):
            output += f"\n  Post {i}: {p.get('format','')} {p.get('platform','')} — {p.get('caption','')[:60]}..."

    return output
