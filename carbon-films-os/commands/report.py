#!/usr/bin/env python3
"""
/report

O Analyst gera um relatório consolidado da operação.
"""
import sys
sys.path.insert(0, str(__file__).replace("/commands/report.py", ""))

from core.db import get_active_objectives, get_pending_tasks, get_leads
from core.claude_client import ask
from core.config import brain_context

ANALYST_SYSTEM = """
Você é o Analyst Agent da Carbon Films.
Seu papel é analisar dados operacionais e gerar relatórios claros, diretos e acionáveis.
Sempre termine com: "Próximos 3 passos recomendados:"
"""

def run():
    print("\n⏳ Analyst gerando relatório...\n")

    objectives = get_active_objectives()
    pending    = get_pending_tasks()
    leads      = get_leads()

    leads_by_status = {}
    for l in leads:
        leads_by_status[l["status"]] = leads_by_status.get(l["status"], 0) + 1

    data = f"""
## Objetivos ativos
{len(objectives)} objetivo(s) em andamento.
{chr(10).join(f"- {o['title']} | {o['done_tasks'] or 0}/{o['total_tasks'] or 0} tarefas | prazo: {o.get('deadline', 'sem prazo')}" for o in objectives)}

## Tarefas pendentes
Total: {len(pending)} tarefa(s) pendente(s).
Por agente: {dict((a, sum(1 for t in pending if t['agent']==a)) for a in set(t['agent'] for t in pending))}

## Pipeline de leads
Total de leads: {len(leads)}
Por status: {leads_by_status}
"""

    report = ask(ANALYST_SYSTEM, f"Gere um relatório operacional conciso baseado nos dados abaixo:\n\n{data}")

    print("="*60)
    print("  RELATÓRIO OPERACIONAL — CARBON FILMS")
    print("="*60)
    print(report)
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
