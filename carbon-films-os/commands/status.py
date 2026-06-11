#!/usr/bin/env python3
"""
/status

Mostra objetivos ativos e tarefas pendentes por agente.
"""
import sys
sys.path.insert(0, str(__file__).replace("/commands/status.py", ""))

from core.db import get_active_objectives, get_pending_tasks

PRIORITY_ICON = {"high": "🔴", "medium": "🟡", "low": "🟢"}
STATUS_ICON   = {"pending": "⏳", "running": "▶️", "done": "✅", "failed": "❌", "blocked": "🚫"}

def run():
    print("\n" + "="*60)
    print("  CARBON FILMS — STATUS OPERACIONAL")
    print("="*60)

    # Objetivos
    objectives = get_active_objectives()
    if objectives:
        print(f"\n📎 OBJETIVOS ATIVOS ({len(objectives)})\n")
        for o in objectives:
            icon = PRIORITY_ICON.get(o["priority"], "•")
            total  = o["total_tasks"] or 0
            done   = o["done_tasks"] or 0
            pct    = int((done / total * 100)) if total > 0 else 0
            bar    = ("█" * (pct // 10)).ljust(10)
            print(f"  {icon} [{o['id']}] {o['title']}")
            print(f"       {bar} {pct}%  ({done}/{total} tarefas)  {o['department'] or ''}")
            if o.get("deadline"):
                print(f"       📅 Prazo: {o['deadline']}")
            print()
    else:
        print("\n  Nenhum objetivo ativo no momento.\n")

    # Tarefas pendentes por agente
    pending = get_pending_tasks()
    if pending:
        by_agent = {}
        for t in pending:
            by_agent.setdefault(t["agent"], []).append(t)

        print(f"📌 TAREFAS PENDENTES ({len(pending)})\n")
        for agent, tasks in sorted(by_agent.items()):
            print(f"  🤖 {agent.upper()} ({len(tasks)} tarefa{'s' if len(tasks) > 1 else ''})")
            for t in tasks:
                icon = PRIORITY_ICON.get(t["priority"], "•")
                print(f"     {icon} [{t['id']}] {t['task'][:70]}")
            print()
    else:
        print("  ✅ Nenhuma tarefa pendente.\n")

    print("="*60)
    print("  Use `/run <agente>` para executar tarefas de um agente.")
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
