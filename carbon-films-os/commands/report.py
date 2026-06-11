#!/usr/bin/env python3
"""
/report — Analyst gera relatório consolidado da operação.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db import get_active_objectives, get_pending_tasks, get_leads
from core.claude_client import ask

ANALYST_SYSTEM = """
Você é o Analyst Agent da Carbon Films.
Analise dados operacionais e gere relatórios claros, diretos e acionáveis.
Termine sempre com: "Próximos 3 passos recomendados:"
"""


def run():
    print("\n⏳ Analyst gerando relatório...\n")

    objectives = get_active_objectives()
    pending    = get_pending_tasks()
    leads      = get_leads()

    by_status = {}
    for l in leads:
        by_status[l["status"]] = by_status.get(l["status"], 0) + 1

    data = f"""
## Objetivos ativos ({len(objectives)})
{chr(10).join(f"- {o['title']} | {o['done_tasks'] or 0}/{o['total_tasks'] or 0} tarefas | prazo: {o.get('deadline','sem prazo')}" for o in objectives)}

## Tarefas pendentes: {len(pending)}
Por agente: { {a: sum(1 for t in pending if t['agent']==a) for a in set(t['agent'] for t in pending)} }

## Pipeline de leads
Total: {len(leads)} | Por status: {by_status}
"""

    report = ask(ANALYST_SYSTEM,
                 f"Relatório operacional conciso baseado nos dados:\n\n{data}",
                 max_tokens=1000)

    print("=" * 60)
    print("  RELATÓRIO OPERACIONAL — CARBON FILMS")
    print("=" * 60)
    print(report)
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run()
