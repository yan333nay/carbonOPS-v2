"""
Social Worker
Responsável: Conteúdo Instagram — executa auto-carousel.js e story-pipeline.js
"""
import subprocess
import os
from core.claude_client import ask_json
from core.db import log_action
from core.config import brain_context

SOCIAL_MEDIA_DIR = "/root/social-media"

SYSTEM = """
Você é o Social Agent da Carbon Films.
Gerencia o conteúdo do Instagram @carbonfilms.sc.
Executa pipelines de carrossel e story. Analisa performance de conteúdo.
"""


def _run_script(script: str, args: list = None, cwd: str = SOCIAL_MEDIA_DIR) -> dict:
    cmd = ["node", script] + (args or [])
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
    return {
        "returncode": result.returncode,
        "stdout": result.stdout[-1000:],
        "stderr": result.stderr[-500:],
        "ok": result.returncode == 0,
    }


def execute(task: dict) -> str:
    task_text = task["task"].lower()

    # Carrossel
    if any(w in task_text for w in ["carrossel", "carousel", "post", "publicar"]):
        dry_run = "dry" in task_text or "teste" in task_text
        args = ["--dry-run"] if dry_run else []
        r = _run_script("scripts/auto-carousel.js", args)
        log_action("social", "carousel_executado", task_id=task["id"],
                   details={"ok": r["ok"], "stdout": r["stdout"]})
        if r["ok"]:
            return f"Carrossel {'(dry-run)' if dry_run else ''} executado com sucesso. {r['stdout'][:200]}"
        return f"Erro no carrossel: {r['stderr'][:300]}"

    # Story
    if any(w in task_text for w in ["story", "slide", "whatsapp"]):
        r = _run_script("scripts/story-pipeline.js")
        log_action("social", "story_executado", task_id=task["id"],
                   details={"ok": r["ok"]})
        return f"Story pipeline {'OK' if r['ok'] else 'ERRO: ' + r['stderr'][:200]}"

    # Análise / estratégia — usa Claude
    brain = brain_context()
    prompt = f"""
## Contexto
{brain}

## Tarefa
{task['task']}

Retorne JSON:
{{
  "summary": "o que foi feito/decidido",
  "content_suggestions": ["sugestão 1", "sugestão 2"],
  "next_action": "próximo passo"
}}
"""
    result = ask_json(SYSTEM, prompt)
    return result.get("summary", "") + " | " + result.get("next_action", "")
