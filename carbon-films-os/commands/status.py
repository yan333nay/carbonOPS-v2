#!/usr/bin/env python3
"""
/status — Mostra objetivos ativos e tarefas pendentes.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db import get_active_objectives, get_pending_tasks

P = {"high": "🔴", "medium": "🟡", "low": "🟢"}


def run():
    print("\n" + "=" * 60)
    print("  CARBON FILMS — STATUS OPERACIONAL")
    print("=" * 60)

    objectives = get_active_objectives()
    if objectives:
        print(f"\n📎 OBJETIVOS ATIVOS ({len(objectives)})\n")
        for o in objectives:
            total = o["total_tasks"] or 0
            done  = o["done_tasks"]  or 0
            pct   = int(done / total * 100) if total > 0 else 0
            bar   = ("█" * (pct // 10)).ljust(10)
            print(f"  {P.get(o['priority'], '•')} [{o['id']}] {o['title']}")
            print(f"       {bar} {pct}%  ({done}/{total})  {o['department'] or ''}")
            if o.get("deadline"):
                print(f"       📅 {o['deadline']}")
            print()
    else:
        print("\n  Nenhum objetivo ativo.\n")

    pending = get_pending_tasks()
    if pending:
        by_agent = {}
        for t in pending:
            by_agent.setdefault(t["agent"], []).append(t)
        print(f"📌 TAREFAS PENDENTES ({len(pending)})\n")
        for agent, tasks in sorted(by_agent.items()):
            print(f"  🤖 {agent.upper()} ({len(tasks)})")
            for t in tasks:
                print(f"     {P.get(t['priority'], '•')} [{t['id']}] {t['task'][:70]}")
            print()
    else:
        print("  ✅ Nenhuma tarefa pendente.\n")

    print("=" * 60)
    print("  /manager \"objetivo\" | /run <agente> | /report | /brain")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run()
