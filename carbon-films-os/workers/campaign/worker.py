"""
Campaign Worker
Responsável: Cadência de prospecção WhatsApp — monitora e ajusta o whatsapp-sales
"""
import subprocess
import json
import os
from pathlib import Path
from core.claude_client import ask_json
from core.db import log_action
from core.config import brain_context

WS_DIR = "/root/whatsapp-sales"
DB_PATH = Path(WS_DIR) / "data" / "campaign-db.json"

SYSTEM = """
Você é o Campaign Agent da Carbon Films.
Gerencia a cadência de prospecção pelo WhatsApp.
Monitora métricas, sugere ajustes e executa relatórios.
"""


def _load_campaign_db() -> dict:
    try:
        return json.loads(DB_PATH.read_text())
    except Exception:
        return {"contacts": [], "sentLog": []}


def execute(task: dict) -> str:
    task_text = task["task"].lower()
    db = _load_campaign_db()
    contacts = db.get("contacts", [])

    # Relatório de status
    if any(w in task_text for w in ["relatório", "relatorio", "status", "métricas", "metricas"]):
        result = subprocess.run(
            ["node", "scripts/daily-report.js"],
            cwd=WS_DIR, capture_output=True, text=True, timeout=60
        )
        log_action("campaign", "relatorio_gerado", task_id=task["id"])
        return f"Relatório de campanha gerado. {result.stdout[:300]}"

    # Análise
    total = len(contacts)
    by_status = {}
    for c in contacts:
        by_status[c.get("status", "unknown")] = by_status.get(c.get("status", "unknown"), 0) + 1

    brain = brain_context()
    prompt = f"""
## Contexto da empresa
{brain}

## Estado da campanha
Total de contatos: {total}
Por status: {json.dumps(by_status, ensure_ascii=False)}

## Tarefa
{task['task']}

Retorne JSON:
{{
  "summary": "análise e o que foi feito",
  "adjustments_needed": ["ajuste 1", "ajuste 2"],
  "next_action": "próximo passo"
}}
"""
    result = ask_json(SYSTEM, prompt)
    log_action("campaign", "analise_realizada", task_id=task["id"],
               details={"summary": result.get("summary", "")[:200]})
    return result.get("summary", "") + " | " + result.get("next_action", "")
