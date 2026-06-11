#!/usr/bin/env python3
"""
/manager "<objetivo>"

O Manager lê o company-brain, analisa o objetivo e cria tarefas no banco.
"""
import sys
import json
sys.path.insert(0, str(__file__.replace("/commands/manager.py", "")))

from core.config import brain_context
from core.claude_client import ask_json
from core.db import create_objective, create_task, log_action

MANAGER_SYSTEM = open("manager/manager.md").read()

def run(objective_text: str):
    print(f"\n🧠 Manager recebeu: {objective_text}\n")

    context = brain_context()

    prompt = f"""
## Contexto da empresa
{context}

## Objetivo recebido
{objective_text}

## Sua tarefa
Analise o objetivo acima e retorne um JSON com:
{{
  "title": "título curto do objetivo (max 80 chars)",
  "department": "comercial | marketing | produto | todos",
  "priority": "high | medium | low",
  "deadline": "YYYY-MM-DD ou null",
  "analysis": "sua análise em 2-3 frases",
  "tasks": [
    {{
      "agent": "leads | campaign | sdr | analyst | social",
      "task": "descrição clara e acionável da tarefa",
      "priority": "high | medium | low"
    }}
  ]
}}
"""

    print("⏳ Analisando objetivo...")
    result = ask_json(MANAGER_SYSTEM, prompt)

    # Salva objetivo no banco
    obj_id = create_objective(
        title=result["title"],
        objective=objective_text,
        department=result.get("department"),
        priority=result.get("priority", "medium"),
        deadline=result.get("deadline"),
    )
    print(f"✅ Objetivo criado (id={obj_id}): {result['title']}")
    print(f"📋 Análise: {result['analysis']}\n")

    # Cria tarefas
    print(f"📌 Criando {len(result['tasks'])} tarefa(s):\n")
    for t in result["tasks"]:
        task_id = create_task(
            agent=t["agent"],
            task=t["task"],
            priority=t.get("priority", "medium"),
            objective_id=obj_id,
        )
        print(f"  [{t['priority'].upper():6}] {t['agent']:10} → {t['task']}")
        log_action("manager", f"Tarefa criada para {t['agent']}", task_id=task_id,
                   details={"objective_id": obj_id, "task": t["task"]})

    print(f"\n✅ Pronto. Rode `/run <agente>` para executar as tarefas.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python commands/manager.py \"seu objetivo aqui\"")
        sys.exit(1)
    run(" ".join(sys.argv[1:]))
