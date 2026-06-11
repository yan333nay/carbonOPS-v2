"""
Analyst Worker
Responsável: Análise de conversas, aprendizado e melhoria do SDR
"""
import subprocess
from core.claude_client import ask_json
from core.db import get_leads, log_action
from core.config import brain_context

WS_DIR = "/root/whatsapp-sales"

SYSTEM = """
Você é o Analyst Agent da Carbon Films.
Analisa resultados das operações, identifica padrões e sugere melhorias.
Seu output alimenta o company-brain e os outros agentes.
"""


def execute(task: dict) -> str:
    task_text = task["task"].lower()

    # Roda o conversation-analyst real
    if any(w in task_text for w in ["conversa", "sdr", "bot", "mensagens", "análise"]):
        result = subprocess.run(
            ["node", "scripts/conversation-analyst.js"],
            cwd=WS_DIR, capture_output=True, text=True, timeout=300
        )
        log_action("analyst", "conversation_analyst_rodado", task_id=task["id"],
                   details={"ok": result.returncode == 0})
        if result.returncode == 0:
            return f"Análise de conversas concluída. Regras atualizadas em learned-rules.json."
        return f"Erro no analyst: {result.stderr[:300]}"

    # Análise estratégica
    leads   = get_leads()
    brain   = brain_context()
    by_status = {}
    for l in leads:
        by_status[l["status"]] = by_status.get(l["status"], 0) + 1

    prompt = f"""
## Contexto da empresa
{brain}

## Dados do pipeline
Leads por status: {by_status}
Total: {len(leads)}

## Tarefa
{task['task']}

Retorne JSON:
{{
  "summary": "análise realizada",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "next_action": "próximo passo"
}}
"""
    result = ask_json(SYSTEM, prompt)
    log_action("analyst", "analise_estrategica", task_id=task["id"],
               details={"insights": result.get("insights", [])})
    return result.get("summary", "") + " | Recomendações: " + "; ".join(result.get("recommendations", []))
